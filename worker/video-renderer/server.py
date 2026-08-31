from pathlib import Path
import subprocess
import tempfile
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

app = FastAPI(title="I AM Magnanimous Video Renderer")
OUT = Path("/tmp/iam-video")
OUT.mkdir(parents=True, exist_ok=True)

class VideoRequest(BaseModel):
    text: str = Field(default="Faith can move mountains.", max_length=3000)
    title: str = Field(default="I AM Magnanimous Way™", max_length=200)
    width: int = Field(default=1280, ge=320, le=1920)
    height: int = Field(default=720, ge=240, le=1080)
    duration: int = Field(default=10, ge=1, le=60)

@app.get("/health")
def health():
    return {"status": "ok", "renderer": "FFmpeg", "free_renderer": True}

@app.post("/api/video/render")
def render_video(req: VideoRequest):
    job = uuid.uuid4().hex
    outfile = OUT / f"{job}.mp4"
    title_file = OUT / f"{job}-title.txt"
    text_file = OUT / f"{job}-text.txt"
    title_file.write_text(req.title, encoding="utf-8")
    text_file.write_text(req.text, encoding="utf-8")

    title_size = max(30, req.width // 24)
    body_size = max(26, req.width // 30)
    vf = (
        f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:"
        f"textfile='{title_file}':fontcolor=white:fontsize={title_size}:"
        "x=(w-text_w)/2:y=h*0.12:box=1:boxcolor=black@0.45:boxborderw=20,"
        f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:"
        f"textfile='{text_file}':fontcolor=white:fontsize={body_size}:"
        "line_spacing=12:x=(w-text_w)/2:y=(h-text_h)/2:"
        "box=1:boxcolor=black@0.35:boxborderw=24"
    )
    cmd = [
        "ffmpeg", "-y", "-f", "lavfi", "-i",
        f"color=c=0x17112b:s={req.width}x{req.height}:d={req.duration}",
        "-vf", vf, "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(outfile),
    ]
    try:
        completed = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if completed.returncode != 0:
            raise RuntimeError(completed.stderr[-3000:])
    except Exception as exc:
        title_file.unlink(missing_ok=True)
        text_file.unlink(missing_ok=True)
        outfile.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Video render failed: {exc}")
    finally:
        title_file.unlink(missing_ok=True)
        text_file.unlink(missing_ok=True)

    return {
        "download_url": f"/api/video/download/{outfile.name}",
        "filename": outfile.name,
        "renderer": "FFmpeg",
        "free_renderer": True,
    }

@app.get("/api/video/download/{filename}")
def download_video(filename: str):
    if Path(filename).name != filename or not filename.endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Invalid video filename")
    path = OUT / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Video not found or expired")
    return FileResponse(path, media_type="video/mp4", filename=filename)
