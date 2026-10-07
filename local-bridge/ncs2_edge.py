#!/usr/bin/env python3
"""Magnanimous NCS2 edge runtime.

Bounded offline inference for Intel Neural Compute Stick 2 (MYRIAD).
Supports status/benchmark, image detection/media triage, bounded folder scans,
and sampled video scans. No inbound network listener is created.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import tempfile
import time
from pathlib import Path

import numpy as np
from openvino.runtime import AsyncInferQueue, Core, Model, get_version, opset8

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_SUFFIXES = {".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm", ".mpeg", ".mpg"}


def emit(data):
    print(json.dumps(data, separators=(",", ":"), ensure_ascii=True))


def core_and_device():
    core = Core()
    devices = list(core.available_devices)
    if "MYRIAD" not in devices:
        raise RuntimeError(f"MYRIAD is not available. OpenVINO sees: {devices}")
    props = {}
    for key in ("FULL_DEVICE_NAME", "OPTIMIZATION_CAPABILITIES", "RANGE_FOR_ASYNC_INFER_REQUESTS"):
        try:
            props[key.lower()] = core.get_property("MYRIAD", key)
        except Exception:
            pass
    return core, devices, props


def status(_args):
    _core, devices, props = core_and_device()
    emit({
        "ok": True,
        "device": "MYRIAD",
        "available_devices": devices,
        "device_name": props.get("full_device_name", "Intel Movidius Myriad X VPU"),
        "properties": props,
        "offline_capable": True,
        "runtime": get_version(),
    })


def build_benchmark_model():
    param = opset8.parameter([1, 3, 224, 224], np.float32, name="input")
    return Model([opset8.relu(param)], [param], "magnanimous_ncs2_benchmark")


def benchmark(args):
    core, devices, props = core_and_device()
    count = max(10, min(1000, int(args.count)))
    jobs = max(1, min(8, int(args.jobs)))
    compiled = core.compile_model(build_benchmark_model(), "MYRIAD")
    sample = np.random.default_rng(7).normal(size=(1, 3, 224, 224)).astype(np.float32)
    for _ in range(5):
        compiled([sample])
    t0 = time.perf_counter()
    for _ in range(count):
        compiled([sample])
    sync_seconds = time.perf_counter() - t0
    queue = AsyncInferQueue(compiled, jobs)
    t1 = time.perf_counter()
    for _ in range(count):
        queue.start_async({0: sample})
    queue.wait_all()
    async_seconds = time.perf_counter() - t1
    emit({
        "ok": True, "device": "MYRIAD",
        "device_name": props.get("full_device_name", "Intel Movidius Myriad X VPU"),
        "runtime": get_version(), "count": count, "jobs": jobs,
        "sync": {"seconds": round(sync_seconds, 6), "avg_ms": round(sync_seconds * 1000 / count, 3), "throughput_per_sec": round(count / sync_seconds, 2)},
        "async": {"seconds": round(async_seconds, 6), "avg_ms": round(async_seconds * 1000 / count, 3), "throughput_per_sec": round(count / async_seconds, 2)},
        "available_devices": devices,
    })


def port_name(port, fallback):
    try:
        names = list(port.get_names())
        if names:
            return sorted(names)[0]
    except Exception:
        pass
    try:
        return port.get_any_name()
    except Exception:
        return fallback


def image_metrics(image_path: Path):
    from PIL import Image, ImageFilter, ImageStat
    image = Image.open(image_path).convert("RGB")
    width, height = image.size
    gray = image.convert("L")
    stat = ImageStat.Stat(gray)
    brightness = float(stat.mean[0])
    contrast = float(stat.stddev[0])
    edge_var = float(ImageStat.Stat(gray.filter(ImageFilter.FIND_EDGES)).var[0])
    megapixels = (width * height) / 1_000_000.0
    exposure_score = max(0.0, 1.0 - abs(brightness - 127.5) / 127.5)
    sharpness_score = min(1.0, edge_var / 900.0)
    resolution_score = min(1.0, megapixels / 2.0)
    quality_score = 100.0 * (0.40 * exposure_score + 0.35 * sharpness_score + 0.25 * resolution_score)
    return {
        "image_size": [width, height], "megapixels": round(megapixels, 3),
        "orientation": "landscape" if width > height else ("portrait" if height > width else "square"),
        "brightness": round(brightness, 2), "contrast": round(contrast, 2),
        "edge_variance": round(edge_var, 2), "quality_score": round(quality_score, 1),
        "quality_note": "heuristic visual-quality score; not a semantic or safety judgment",
    }


class DetectorSession:
    def __init__(self, model_path: Path):
        self.model_path = model_path.expanduser().resolve()
        if not self.model_path.is_file() or self.model_path.suffix.lower() != ".xml":
            raise RuntimeError("OpenVINO IR .xml model does not exist.")
        core, self.devices, self.props = core_and_device()
        model = core.read_model(str(self.model_path))
        self.compiled = core.compile_model(model, "MYRIAD")
        inp = self.compiled.input(0)
        self.shape = [int(x) for x in inp.shape]
        if len(self.shape) != 4 or self.shape[0] != 1 or self.shape[1] != 3:
            raise RuntimeError(f"Expected NCHW image model, got input shape {self.shape}")
        _, _, self.height, self.width = self.shape

    def infer(self, image_path: Path, threshold: float):
        from PIL import Image
        image_path = image_path.expanduser().resolve()
        if not image_path.is_file():
            raise RuntimeError("Input image does not exist.")
        image = Image.open(image_path).convert("RGB")
        original_w, original_h = image.size
        resized = image.resize((self.width, self.height))
        rgb = np.asarray(resized, dtype=np.uint8)
        bgr = rgb[:, :, ::-1]
        tensor = np.transpose(bgr, (2, 0, 1))[None, ...].astype(np.float32)
        t0 = time.perf_counter()
        result = self.compiled([tensor])
        elapsed = time.perf_counter() - t0
        outputs = {}
        for idx, port in enumerate(self.compiled.outputs):
            outputs[port_name(port, f"output_{idx}")] = np.asarray(result[port])
        detection_output = None
        boxes = None
        labels = None
        for name, arr in outputs.items():
            lower = name.lower()
            if arr.ndim >= 2 and arr.shape[-1] == 7:
                detection_output = arr.reshape(-1, 7)
            elif "box" in lower or (arr.ndim >= 2 and arr.shape[-1] == 5):
                boxes = arr.reshape(-1, 5)
            elif "label" in lower or (arr.ndim <= 2 and np.issubdtype(arr.dtype, np.integer)):
                labels = arr.reshape(-1)
        threshold = max(0.0, min(1.0, float(threshold)))
        detections = []
        if detection_output is not None:
            model_name = self.model_path.name.lower()
            if "face-detection" in model_name:
                label_names = {1: "face"}
            elif "text-detection" in model_name or "horizontal-text" in model_name:
                label_names = {1: "text"}
            else:
                label_names = {1: "person", 2: "vehicle", 3: "bike"}
            for row in detection_output:
                image_id, label, conf, x1, y1, x2, y2 = [float(x) for x in row]
                if image_id < 0:
                    break
                if conf < threshold:
                    continue
                lid = int(label)
                detections.append({
                    "label_id": lid, "label": label_names.get(lid, f"class_{lid}"), "confidence": round(conf, 5),
                    "box": [max(0, round(x1 * original_w, 1)), max(0, round(y1 * original_h, 1)), min(original_w, round(x2 * original_w, 1)), min(original_h, round(y2 * original_h, 1))],
                })
        elif boxes is not None and labels is not None:
            model_name = self.model_path.name.lower()
            if "text-detection" in model_name or "horizontal-text" in model_name:
                label_names = {0: "text"}
            elif "face-detection" in model_name:
                label_names = {0: "face", 1: "face"}
            else:
                label_names = {0: "vehicle", 1: "person", 2: "bike_or_non_vehicle"}
            for box, label in zip(boxes, labels):
                x1, y1, x2, y2, conf = [float(x) for x in box]
                if conf < threshold:
                    continue
                if max(abs(x1), abs(y1), abs(x2), abs(y2)) <= 2.0:
                    ox1, ox2, oy1, oy2 = x1 * original_w, x2 * original_w, y1 * original_h, y2 * original_h
                else:
                    ox1, ox2 = x1 * original_w / self.width, x2 * original_w / self.width
                    oy1, oy2 = y1 * original_h / self.height, y2 * original_h / self.height
                lid = int(label)
                detections.append({
                    "label_id": lid, "label": label_names.get(lid, f"class_{lid}"), "confidence": round(conf, 5),
                    "box": [max(0, round(ox1, 1)), max(0, round(oy1, 1)), min(original_w, round(ox2, 1)), min(original_h, round(oy2, 1))],
                })
        else:
            summary = {name: list(arr.shape) for name, arr in outputs.items()}
            raise RuntimeError(f"Unsupported detector output layout: {summary}")
        return {
            "device": "MYRIAD", "device_name": self.props.get("full_device_name", "Intel Movidius Myriad X VPU"),
            "runtime": get_version(), "model": str(self.model_path), "threshold": threshold,
            "inference_ms": round(elapsed * 1000, 3), "input_shape": self.shape,
            "image_size": [original_w, original_h], "detection_count": len(detections),
            "detections": detections[:200], "available_devices": self.devices,
        }


def detect(args):
    image_path = Path(args.image).expanduser().resolve()
    session = DetectorSession(Path(args.model))
    out = session.infer(image_path, args.threshold)
    emit({"ok": True, "image": str(image_path), **out})


def triage_record(session: DetectorSession, image_path: Path, threshold: float):
    metrics = image_metrics(image_path)
    detection = session.infer(image_path, threshold)
    return {
        "image": str(image_path), **metrics,
        "device": detection["device"], "runtime": detection["runtime"],
        "detection_count": detection["detection_count"], "detections": detection["detections"],
        "inference_ms": detection["inference_ms"], "offline_capable": True,
    }


def media_triage(args):
    image_path = Path(args.image).expanduser().resolve()
    if not image_path.is_file():
        raise RuntimeError("Input image does not exist.")
    session = DetectorSession(Path(args.model))
    emit({"ok": True, **triage_record(session, image_path, args.threshold)})


def batch_scan(args):
    root = Path(args.directory).expanduser().resolve()
    if not root.is_dir():
        raise RuntimeError("Batch scan directory does not exist.")
    max_files = max(1, min(200, int(args.max_files)))
    iterator = root.rglob("*") if args.recursive else root.glob("*")
    images = [p for p in iterator if p.is_file() and p.suffix.lower() in IMAGE_SUFFIXES][:max_files]
    session = DetectorSession(Path(args.model))
    rows = []
    errors = []
    started = time.perf_counter()
    for path in images:
        try:
            rows.append(triage_record(session, path, args.threshold))
        except Exception as exc:
            errors.append({"image": str(path), "error": f"{type(exc).__name__}: {exc}"})
    elapsed = time.perf_counter() - started
    ranked = sorted(rows, key=lambda r: (float(r.get("quality_score") or 0), int(r.get("detection_count") or 0)), reverse=True)
    emit({
        "ok": True, "directory": str(root), "scanned": len(rows), "errors": errors[:25],
        "elapsed_seconds": round(elapsed, 3), "offline_capable": True,
        "top_candidates": [{"image": r["image"], "quality_score": r["quality_score"], "detection_count": r["detection_count"]} for r in ranked[:10]],
        "items": rows,
    })


def video_scan(args):
    video = Path(args.video).expanduser().resolve()
    if not video.is_file() or video.suffix.lower() not in VIDEO_SUFFIXES:
        raise RuntimeError("Supported video file does not exist.")
    if video.stat().st_size > 4_000_000_000:
        raise RuntimeError("Video exceeds the 4 GB bounded edge-scan limit.")
    every = max(1.0, min(120.0, float(args.every)))
    max_frames = max(1, min(60, int(args.max_frames)))
    try:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as exc:
        raise RuntimeError("Portable FFmpeg is not installed in the NCS2 environment.") from exc
    session = DetectorSession(Path(args.model))
    started = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix="magnanimous_ncs2_video_") as tmp:
        pattern = str(Path(tmp) / "frame_%04d.jpg")
        cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-i", str(video), "-vf", f"fps=1/{every}", "-frames:v", str(max_frames), "-q:v", "3", pattern]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or "FFmpeg frame sampling failed.")
        frames = sorted(Path(tmp).glob("frame_*.jpg"))[:max_frames]
        rows = []
        for idx, frame in enumerate(frames):
            rec = triage_record(session, frame, args.threshold)
            rec.pop("image", None)
            rec["frame_index"] = idx
            rec["approx_timestamp_seconds"] = round(idx * every, 3)
            rec["candidate_score"] = round(float(rec.get("quality_score") or 0) + min(20.0, int(rec.get("detection_count") or 0) * 5.0), 1)
            rows.append(rec)
    elapsed = time.perf_counter() - started
    ranked = sorted(rows, key=lambda r: float(r.get("candidate_score") or 0), reverse=True)
    label_counts = {}
    for row in rows:
        for det in row.get("detections") or []:
            label = str(det.get("label") or "unknown")
            label_counts[label] = label_counts.get(label, 0) + 1
    emit({
        "ok": True, "video": str(video), "sample_every_seconds": every, "frames_scanned": len(rows),
        "elapsed_seconds": round(elapsed, 3), "offline_capable": True, "label_counts": label_counts,
        "top_candidate_timestamps": [{"seconds": r["approx_timestamp_seconds"], "candidate_score": r["candidate_score"], "quality_score": r["quality_score"], "detection_count": r["detection_count"]} for r in ranked[:10]],
        "frames": rows,
    })


def main():
    parser = argparse.ArgumentParser(description="Magnanimous NCS2 edge runtime")
    sub = parser.add_subparsers(dest="command", required=True)
    p_status = sub.add_parser("status"); p_status.set_defaults(func=status)
    p_bench = sub.add_parser("benchmark"); p_bench.add_argument("--count", type=int, default=100); p_bench.add_argument("--jobs", type=int, default=4); p_bench.set_defaults(func=benchmark)
    p_detect = sub.add_parser("detect"); p_detect.add_argument("--image", required=True); p_detect.add_argument("--model", required=True); p_detect.add_argument("--threshold", type=float, default=0.5); p_detect.set_defaults(func=detect)
    p_triage = sub.add_parser("triage"); p_triage.add_argument("--image", required=True); p_triage.add_argument("--model", required=True); p_triage.add_argument("--threshold", type=float, default=0.5); p_triage.set_defaults(func=media_triage)
    p_batch = sub.add_parser("batch-scan"); p_batch.add_argument("--directory", required=True); p_batch.add_argument("--model", required=True); p_batch.add_argument("--threshold", type=float, default=0.5); p_batch.add_argument("--max-files", type=int, default=30); p_batch.add_argument("--recursive", action="store_true"); p_batch.set_defaults(func=batch_scan)
    p_video = sub.add_parser("video-scan"); p_video.add_argument("--video", required=True); p_video.add_argument("--model", required=True); p_video.add_argument("--threshold", type=float, default=0.5); p_video.add_argument("--every", type=float, default=5.0); p_video.add_argument("--max-frames", type=int, default=24); p_video.set_defaults(func=video_scan)
    args = parser.parse_args(); args.func(args)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        emit({"ok": False, "error": f"{type(exc).__name__}: {exc}"})
        raise SystemExit(1)
