from pathlib import Path
import base64
import json
import subprocess
import urllib.error
import urllib.request
import uuid
import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

app = FastAPI(title="I AM Magnanimous Free Video Renderer")
OUT = Path("/tmp/iam-video")
OUT.mkdir(parents=True, exist_ok=True)
RENDERER_PUBLIC_URL = os.getenv("RENDERER_PUBLIC_URL", "https://iammagnanimousway-js.onrender.com").rstrip("/")

class VideoRequest(BaseModel):
    text: str = Field(default="Faith can move mountains.", max_length=3000)
    title: str = Field(default="I AM Magnanimous Way™", max_length=200)
    width: int = Field(default=1280, ge=320, le=1920)
    height: int = Field(default=720, ge=240, le=1080)
    duration: int = Field(default=10, ge=1, le=60)


def mux_configured():
    return bool(os.getenv("MUX_TOKEN_ID") and os.getenv("MUX_TOKEN_SECRET"))


def mux_auth_header():
    raw = f"{os.environ['MUX_TOKEN_ID']}:{os.environ['MUX_TOKEN_SECRET']}".encode()
    return "Basic " + base64.b64encode(raw).decode()


def publish_to_mux(filename: str, title: str):
    if not mux_configured():
        return {"configured": False}

    source_url = f"{RENDERER_PUBLIC_URL}/api/video/download/{filename}"
    payload = json.dumps({
        "inputs": [{"url": source_url}],
        "playback_policies": ["public"],
        "video_quality": "basic",
        "meta": {"title": title, "external_id": filename},
    }).encode()
    request = urllib.request.Request(
        "https://api.mux.com/video/v1/assets",
        data=payload,
        method="POST",
        headers={
            "Authorization": mux_auth_header(),
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode()).get("data", {})
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        raise RuntimeError(f"Mux asset creation failed ({exc.code}): {detail[-1500:]}")
    except Exception as exc:
        raise RuntimeError(f"Mux asset creation failed: {exc}")

    playback_ids = data.get("playback_ids") or []
    playback_id = playback_ids[0].get("id") if playback_ids else None
    return {
        "configured": True,
        "asset_id": data.get("id"),
        "playback_id": playback_id,
        "playback_url": f"https://stream.mux.com/{playback_id}.m3u8" if playback_id else None,
        "status": data.get("status", "preparing"),
    }


@app.get("/health")
def health():
    return {"status":"ok","renderer":"FFmpeg","free_renderer":True,"mux_configured":mux_configured()}


@app.post("/api/video/render")
def render_video(req: VideoRequest):
    job = uuid.uuid4().hex
    outfile = OUT / f"{job}.mp4"
    title_file = OUT / f"{job}-title.txt"
    text_file = OUT / f"{job}-text.txt"
    title_file.write_text(req.title, encoding="utf-8")
    text_file.write_text(req.text, encoding="utf-8")
    title_size = max(28, req.width // 24)
    body_size = max(24, req.width // 30)
    font_bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    font_regular = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    vf = (
        f"drawtext=fontfile={font_bold}:textfile={title_file}:fontcolor=white:fontsize={title_size}:"
        "x=(w-text_w)/2:y=h*0.12:box=1:boxcolor=black@0.45:boxborderw=20,"
        f"drawtext=fontfile={font_regular}:textfile={text_file}:fontcolor=white:fontsize={body_size}:"
        "line_spacing=12:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.35:boxborderw=24"
    )
    cmd = [
        "ffmpeg","-y","-f","lavfi","-i",
        f"color=c=0x17112b:s={req.width}x{req.height}:d={req.duration}",
        "-vf",vf,"-r","24","-c:v","libx264","-preset","ultrafast","-crf","28",
        "-threads","1","-pix_fmt","yuv420p","-movflags","+faststart",str(outfile)
    ]
    try:
        completed = subprocess.run(cmd,capture_output=True,text=True,timeout=240)
        if completed.returncode != 0:
            raise RuntimeError(completed.stderr[-3000:])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Video render failed: {exc}")
    finally:
        title_file.unlink(missing_ok=True)
        text_file.unlink(missing_ok=True)

    mux = {"configured": False}
    try:
        mux = publish_to_mux(outfile.name, req.title)
    except Exception as exc:
        # Mux is optional. Never break the working FFmpeg renderer because Mux is unavailable.
        mux = {"configured": True, "error": str(exc)}

    return {
        "download_url":f"/api/video/download/{outfile.name}",
        "filename":outfile.name,
        "renderer":"FFmpeg",
        "free_renderer":True,
        "mux": mux,
    }


@app.get("/api/video/download/{filename}")
def download_video(filename: str):
    if Path(filename).name != filename or not filename.endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Invalid video filename")
    path = OUT / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Video not found or expired")
    return FileResponse(path, media_type="video/mp4", filename=filename)
