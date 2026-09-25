from pathlib import Path
import base64
import json
import subprocess
import textwrap
import urllib.error
import urllib.request
import uuid
import os
import re

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
    height: int = Field(default=720, ge=240, le=1920)
    duration: int = Field(default=10, ge=1, le=60)
    background_image_data_uri: str = Field(default="", max_length=12000000)
    watermark_text: str = Field(default="", max_length=240)
    watermark_required: bool = False
    publish_to_mux: bool = False
    mux_playback_policy: str = Field(default="public", max_length=16)


def wrap_for_video(value: str, max_chars: int) -> str:
    lines = []
    for raw_line in (value or "").splitlines() or [""]:
        wrapped = textwrap.wrap(
            raw_line,
            width=max_chars,
            break_long_words=False,
            break_on_hyphens=False,
        )
        lines.extend(wrapped or [""])
    return "\n".join(lines)


def decode_image_data_uri(value: str):
    raw = (value or "").strip()
    if not raw:
        return None, None
    match = re.match(r"^data:(image/(?:png|jpeg|jpg|webp|svg\+xml));base64,([A-Za-z0-9+/=\r\n]+)$", raw, re.I)
    if not match:
        raise ValueError("Background image must be a supported base64 data URI.")
    data = base64.b64decode(match.group(2), validate=False)
    if not data or len(data) > 9 * 1024 * 1024:
        raise ValueError("Background image must be between 1 byte and 9 MB.")
    subtype = match.group(1).split("/", 1)[1].lower()
    ext = "jpg" if subtype in {"jpeg", "jpg"} else "svg" if subtype == "svg+xml" else subtype
    return data, ext


def mux_configured():
    return bool(os.getenv("MUX_TOKEN_ID") and os.getenv("MUX_TOKEN_SECRET"))


def mux_provider_writes_enabled():
    return os.getenv("ENABLE_MUX_PROVIDER_WRITES", "").strip().lower() in {"1", "true", "yes", "on"}


def mux_auth_header():
    raw = f"{os.environ['MUX_TOKEN_ID']}:{os.environ['MUX_TOKEN_SECRET']}".encode()
    return "Basic " + base64.b64encode(raw).decode()


def publish_to_mux(filename: str, title: str, playback_policy: str = "public"):
    if not mux_configured():
        return {"configured": False, "published": False}
    if not mux_provider_writes_enabled():
        return {"configured": True, "published": False, "owner_write_gate": "disabled"}
    if playback_policy not in {"public", "signed"}:
        raise RuntimeError("Mux playback policy must be public or signed for this renderer adapter.")

    source_url = f"{RENDERER_PUBLIC_URL}/api/video/download/{filename}"
    payload = json.dumps({
        "inputs": [{"url": source_url}],
        "playback_policies": [playback_policy],
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
        "published": True,
        "asset_id": data.get("id"),
        "playback_id": playback_id,
        "playback_policy": playback_policy,
        "playback_url": f"https://stream.mux.com/{playback_id}.m3u8" if playback_id else None,
        "status": data.get("status", "preparing"),
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "renderer": "FFmpeg",
        "free_renderer": True,
        "scene_backgrounds": True,
        "burned_watermark": True,
        "mux_configured": mux_configured(),
        "mux_provider_writes_enabled": mux_provider_writes_enabled(),
    }


@app.post("/api/video/render")
def render_video(req: VideoRequest):
    job = uuid.uuid4().hex
    outfile = OUT / f"{job}.mp4"
    title_file = OUT / f"{job}-title.txt"
    text_file = OUT / f"{job}-text.txt"
    watermark_file = OUT / f"{job}-watermark.txt"
    background_file = None
    title_size = max(28, req.width // 24)
    body_size = max(24, req.width // 30)
    watermark_size = max(17, req.width // 58)
    title_chars = max(18, int(req.width / max(1, title_size * 0.58)))
    body_chars = max(24, int(req.width / max(1, body_size * 0.56)))
    title_file.write_text(wrap_for_video(req.title, title_chars), encoding="utf-8")
    text_file.write_text(wrap_for_video(req.text, body_chars), encoding="utf-8")
    watermark = (req.watermark_text or "").strip()
    if req.watermark_required and not watermark:
        watermark = "Magnanimous AI • I AM MAGNANIMOUS WAY™"
    watermark_file.write_text(watermark, encoding="utf-8")
    font_bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    font_regular = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    filters = []
    try:
        image_data, image_ext = decode_image_data_uri(req.background_image_data_uri)
        if image_data:
            background_file = OUT / f"{job}-background.{image_ext}"
            background_file.write_bytes(image_data)
            filters.append(
                f"scale={req.width}:{req.height}:force_original_aspect_ratio=increase,"
                f"crop={req.width}:{req.height},"
                f"zoompan=z='min(zoom+0.0007,1.07)':d={req.duration * 24}:"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={req.width}x{req.height}:fps=24"
            )
        if req.title.strip():
            filters.append(
                f"drawtext=fontfile={font_bold}:textfile={title_file}:fontcolor=white:fontsize={title_size}:"
                "x=(w-text_w)/2:y=h*0.10:box=1:boxcolor=black@0.42:boxborderw=18"
            )
        if req.text.strip():
            filters.append(
                f"drawtext=fontfile={font_regular}:textfile={text_file}:fontcolor=white:fontsize={body_size}:"
                "line_spacing=12:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.32:boxborderw=22"
            )
        if watermark:
            filters.append(
                f"drawtext=fontfile={font_bold}:textfile={watermark_file}:fontcolor=white@0.94:fontsize={watermark_size}:"
                "x=w-text_w-24:y=h-text_h-22:box=1:boxcolor=black@0.48:boxborderw=12"
            )
        vf = ",".join(filters) if filters else "null"
        if background_file:
            cmd = ["ffmpeg","-y","-loop","1","-i",str(background_file),"-t",str(req.duration)]
        else:
            cmd = ["ffmpeg","-y","-f","lavfi","-i",f"color=c=0x17112b:s={req.width}x{req.height}:d={req.duration}"]
        cmd += [
            "-vf",vf,"-r","24","-c:v","libx264","-preset","veryfast","-crf","22",
            "-threads","1","-pix_fmt","yuv420p","-movflags","+faststart",str(outfile)
        ]
        completed = subprocess.run(cmd,capture_output=True,text=True,timeout=240)
        if completed.returncode != 0:
            raise RuntimeError(completed.stderr[-3000:])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Video render failed: {exc}")
    finally:
        title_file.unlink(missing_ok=True)
        text_file.unlink(missing_ok=True)
        watermark_file.unlink(missing_ok=True)
        if background_file:
            background_file.unlink(missing_ok=True)

    mux = {
        "configured": mux_configured(),
        "published": False,
        "requested": bool(req.publish_to_mux),
        "owner_write_gate": "enabled" if mux_provider_writes_enabled() else "disabled",
    }
    if req.publish_to_mux:
        try:
            mux = publish_to_mux(outfile.name, req.title, req.mux_playback_policy)
            mux["requested"] = True
        except Exception as exc:
            # Mux is optional. Never break the working FFmpeg renderer because Mux is unavailable.
            mux = {"configured": mux_configured(), "published": False, "requested": True, "error": str(exc)}

    return {
        "download_url":f"/api/video/download/{outfile.name}",
        "filename":outfile.name,
        "renderer":"Magnanimous Movie Renderer",
        "free_renderer":True,
        "watermarked": bool(watermark),
        "scene_background": bool(req.background_image_data_uri),
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