from pathlib import Path
import base64
import json
import subprocess
import textwrap
import urllib.error
import urllib.request
import urllib.parse
import shutil
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

class EditSegment(BaseModel):
    url: str = Field(max_length=1600)
    trim_start_ms: int = Field(default=0, ge=0, le=86_400_000)
    trim_end_ms: int | None = Field(default=None, ge=1, le=86_400_000)


class EditRequest(BaseModel):
    title: str = Field(default="Magnanimous edit", max_length=200)
    segments: list[EditSegment] = Field(min_length=1, max_length=40)
    width: int = Field(default=1280, ge=320, le=1920)
    height: int = Field(default=720, ge=240, le=1920)
    watermark_text: str = Field(default="", max_length=240)
    watermark_required: bool = False


class MediaEditRequest(BaseModel):
    source_url: str = Field(max_length=1600)
    op: str = Field(max_length=40)
    start_seconds: float = Field(default=0, ge=0, le=86400)
    end_seconds: float | None = Field(default=None, gt=0, le=86400)
    at_seconds: float = Field(default=0, ge=0, le=86400)
    width: int = Field(default=1280, ge=16, le=4096)
    height: int = Field(default=720, ge=16, le=4096)
    output_format: str = Field(default="", max_length=12)
    bitrate_kbps: int = Field(default=160, ge=32, le=320)
    sample_rate_hz: int = Field(default=48000)
    channels: int = Field(default=2, ge=1, le=2)
    target_lufs: float = Field(default=-16, ge=-30, le=-5)



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


def approved_media_url(value: str) -> str:
    parsed = urllib.parse.urlparse((value or "").strip())
    allowed = {x.strip().lower() for x in os.getenv("MAGNANIMOUS_PUBLIC_MEDIA_HOSTS", "iammagnanimousway.com,www.iammagnanimousway.com").split(",") if x.strip()}
    if parsed.scheme != "https" or (parsed.hostname or "").lower() not in allowed:
        raise ValueError("Edit sources must use an approved Magnanimous HTTPS host.")
    if not parsed.path.startswith("/api/video-stack/access/"):
        raise ValueError("Edit sources must use short-lived Magnanimous media access links.")
    if parsed.username or parsed.password or parsed.port not in {None, 443}:
        raise ValueError("Edit source URL is not allowed.")
    return urllib.parse.urlunparse(parsed)


def download_media_source(url: str, target: Path, max_bytes: int = 180 * 1024 * 1024):
    approved = approved_media_url(url)
    request = urllib.request.Request(approved, headers={"User-Agent": "Magnanimous-Video-Editor/1.0"})
    total = 0
    try:
        with urllib.request.urlopen(request, timeout=90) as response, target.open("wb") as out:
            final_url = response.geturl()
            approved_media_url(final_url)
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    raise ValueError("Edit source exceeds the per-clip safety limit.")
                out.write(chunk)
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Magnanimous edit source returned {exc.code}.")
    if total <= 0:
        raise ValueError("Edit source was empty.")
    return total


def media_has_audio(path: Path) -> bool:
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_type", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, timeout=30
    )
    return probe.returncode == 0 and "audio" in probe.stdout.lower()


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
        "clip_editor": True,
        "media_edit": ["trim_media","extract_audio","extract_thumbnail","normalize_loudness","probe_media"],
        "private_edit_sources_only": True,
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


@app.post("/api/video/edit")
def edit_video(req: EditRequest):
    job = uuid.uuid4().hex
    work = OUT / f"{job}-edit"
    work.mkdir(parents=True, exist_ok=True)
    outfile = OUT / f"{job}.mp4"
    watermark_file = work / "watermark.txt"
    try:
        rendered = []
        for index, segment in enumerate(req.segments):
            source = work / f"source-{index:03d}.mp4"
            clip = work / f"clip-{index:03d}.mp4"
            download_media_source(segment.url, source)
            start = max(0, segment.trim_start_ms) / 1000.0
            duration = None
            if segment.trim_end_ms is not None:
                duration = max(0.05, (segment.trim_end_ms - segment.trim_start_ms) / 1000.0)
            has_audio = media_has_audio(source)
            cmd = ["ffmpeg", "-y"]
            if start > 0:
                cmd += ["-ss", f"{start:.3f}"]
            cmd += ["-i", str(source)]
            if not has_audio:
                cmd += ["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"]
            if duration is not None:
                cmd += ["-t", f"{duration:.3f}"]
            vf = (
                f"scale={req.width}:{req.height}:force_original_aspect_ratio=decrease,"
                f"pad={req.width}:{req.height}:(ow-iw)/2:(oh-ih)/2:black,fps=24"
            )
            cmd += ["-map", "0:v:0"]
            cmd += ["-map", "0:a:0" if has_audio else "1:a:0"]
            cmd += [
                "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
                "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart"
            ]
            if not has_audio:
                cmd += ["-shortest"]
            cmd += [str(clip)]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=360)
            if result.returncode != 0:
                raise RuntimeError(f"Clip {index + 1} normalization failed: {result.stderr[-1800:]}")
            rendered.append(clip)

        concat_file = work / "concat.txt"
        concat_file.write_text("\n".join("file '" + str(p).replace("'", "'\\''") + "'" for p in rendered), encoding="utf-8")
        merged = work / "merged.mp4"
        merged_result = subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", "-movflags", "+faststart", str(merged)],
            capture_output=True, text=True, timeout=360
        )
        if merged_result.returncode != 0:
            raise RuntimeError("Clip concatenation failed: " + merged_result.stderr[-1800:])

        watermark = (req.watermark_text or "").strip()
        if req.watermark_required and not watermark:
            watermark = "Magnanimous AI • I AM MAGNANIMOUS WAY™"
        if watermark:
            watermark_file.write_text(watermark, encoding="utf-8")
            font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
            size = max(17, req.width // 58)
            vf = (
                f"drawtext=fontfile={font}:textfile={watermark_file}:fontcolor=white@0.94:fontsize={size}:"
                "x=w-text_w-24:y=h-text_h-22:box=1:boxcolor=black@0.48:boxborderw=12"
            )
            final_result = subprocess.run(
                ["ffmpeg", "-y", "-i", str(merged), "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
                 "-c:a", "copy", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(outfile)],
                capture_output=True, text=True, timeout=360
            )
            if final_result.returncode != 0:
                raise RuntimeError("Final watermark render failed: " + final_result.stderr[-1800:])
        else:
            shutil.copyfile(merged, outfile)
    except Exception as exc:
        outfile.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Video edit failed: {exc}")
    finally:
        shutil.rmtree(work, ignore_errors=True)

    return {
        "download_url": f"/api/video/download/{outfile.name}",
        "filename": outfile.name,
        "renderer": "Magnanimous Native Video Editor",
        "segments": len(req.segments),
        "watermarked": bool(req.watermark_required or req.watermark_text),
        "ready_to_play": True,
    }


@app.post("/api/video/media-edit")
def media_edit(req: MediaEditRequest):
    allowed_ops = {"probe_media", "trim_media", "extract_audio", "extract_thumbnail", "normalize_loudness"}
    if req.op not in allowed_ops:
        raise HTTPException(status_code=400, detail="Unsupported media edit operation")
    job = uuid.uuid4().hex
    work = OUT / f"{job}-media"
    work.mkdir(parents=True, exist_ok=True)
    source = work / "source.mp4"
    try:
        download_media_source(req.source_url, source)
        if req.op == "probe_media":
            probe = subprocess.run(
                ["ffprobe","-v","error","-show_entries","format=duration,size,bit_rate:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels","-of","json",str(source)],
                capture_output=True,text=True,timeout=45
            )
            if probe.returncode != 0:
                raise RuntimeError("Media probe failed: " + probe.stderr[-1200:])
            data = json.loads(probe.stdout or "{}")
            return {"ok": True, "operation": req.op, "metadata": data}

        start = max(0.0, float(req.start_seconds or 0))
        duration = None
        if req.end_seconds is not None:
            if req.end_seconds <= start:
                raise ValueError("end_seconds must be after start_seconds")
            duration = float(req.end_seconds) - start

        if req.op == "trim_media":
            fmt = req.output_format.lower() if req.output_format.lower() in {"mp4","mov","webm","mkv"} else "mp4"
            outfile = OUT / f"{job}.{fmt}"
            cmd = ["ffmpeg","-y"]
            if start > 0: cmd += ["-ss", f"{start:.3f}"]
            cmd += ["-i", str(source)]
            if duration is not None: cmd += ["-t", f"{duration:.3f}"]
            if fmt == "webm":
                cmd += ["-c:v","libvpx-vp9","-crf","32","-b:v","0","-c:a","libopus"]
            else:
                cmd += ["-c:v","libx264","-preset","veryfast","-crf","22","-c:a","aac","-b:a","160k","-pix_fmt","yuv420p","-movflags","+faststart"]
            cmd += [str(outfile)]
            media_type = "video/webm" if fmt == "webm" else "video/mp4" if fmt == "mp4" else "video/quicktime" if fmt == "mov" else "video/x-matroska"

        elif req.op == "extract_audio":
            fmt = req.output_format.lower() if req.output_format.lower() in {"mp3","wav","aac","flac","ogg"} else "mp3"
            outfile = OUT / f"{job}.{fmt}"
            cmd = ["ffmpeg","-y"]
            if start > 0: cmd += ["-ss", f"{start:.3f}"]
            cmd += ["-i", str(source)]
            if duration is not None: cmd += ["-t", f"{duration:.3f}"]
            cmd += ["-vn","-ar",str(req.sample_rate_hz),"-ac",str(req.channels)]
            if fmt == "mp3": cmd += ["-c:a","libmp3lame","-b:a",f"{req.bitrate_kbps}k"]
            elif fmt == "aac": cmd += ["-c:a","aac","-b:a",f"{req.bitrate_kbps}k"]
            elif fmt == "ogg": cmd += ["-c:a","libvorbis","-b:a",f"{req.bitrate_kbps}k"]
            elif fmt == "flac": cmd += ["-c:a","flac"]
            else: cmd += ["-c:a","pcm_s16le"]
            cmd += [str(outfile)]
            media_type = {"mp3":"audio/mpeg","wav":"audio/wav","aac":"audio/aac","flac":"audio/flac","ogg":"audio/ogg"}[fmt]

        elif req.op == "extract_thumbnail":
            fmt = req.output_format.lower() if req.output_format.lower() in {"jpg","png","webp"} else "jpg"
            outfile = OUT / f"{job}.{fmt}"
            vf = f"scale={req.width}:{req.height}:force_original_aspect_ratio=decrease,pad={req.width}:{req.height}:(ow-iw)/2:(oh-ih)/2:black"
            cmd = ["ffmpeg","-y","-ss",f"{max(0.0,float(req.at_seconds or 0)):.3f}","-i",str(source),"-frames:v","1","-vf",vf,str(outfile)]
            media_type = {"jpg":"image/jpeg","png":"image/png","webp":"image/webp"}[fmt]

        else:
            fmt = req.output_format.lower() if req.output_format.lower() in {"mp3","wav","aac"} else "mp3"
            outfile = OUT / f"{job}.{fmt}"
            cmd = ["ffmpeg","-y","-i",str(source),"-vn","-af",f"loudnorm=I={req.target_lufs}:TP=-1.5:LRA=11","-ar",str(req.sample_rate_hz),"-ac",str(req.channels)]
            if fmt == "mp3": cmd += ["-c:a","libmp3lame","-b:a",f"{req.bitrate_kbps}k"]
            elif fmt == "aac": cmd += ["-c:a","aac","-b:a",f"{req.bitrate_kbps}k"]
            else: cmd += ["-c:a","pcm_s16le"]
            cmd += [str(outfile)]
            media_type = {"mp3":"audio/mpeg","wav":"audio/wav","aac":"audio/aac"}[fmt]

        result = subprocess.run(cmd,capture_output=True,text=True,timeout=360)
        if result.returncode != 0:
            raise RuntimeError(f"{req.op} failed: " + result.stderr[-1800:])
        return {
            "ok": True, "operation": req.op, "download_url": f"/api/video/download/{outfile.name}",
            "filename": outfile.name, "content_type": media_type, "bytes": outfile.stat().st_size
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Media edit failed: {exc}")
    finally:
        shutil.rmtree(work, ignore_errors=True)


@app.get("/api/video/download/{filename}")
def download_video(filename: str):
    if Path(filename).name != filename:
        raise HTTPException(status_code=400, detail="Invalid media filename")
    suffix = Path(filename).suffix.lower()
    media = {
        ".mp4":"video/mp4",".webm":"video/webm",".mov":"video/quicktime",".mkv":"video/x-matroska",
        ".mp3":"audio/mpeg",".wav":"audio/wav",".aac":"audio/aac",".flac":"audio/flac",".ogg":"audio/ogg",
        ".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp"
    }.get(suffix)
    if not media:
        raise HTTPException(status_code=400, detail="Unsupported media filename")
    path = OUT / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Media not found or expired")
    return FileResponse(path, media_type=media, filename=filename)