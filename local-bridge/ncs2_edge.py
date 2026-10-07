#!/usr/bin/env python3
"""Magnanimous NCS2 edge runtime.

Runs only bounded Intel Neural Compute Stick 2 inference operations through
OpenVINO 2022.3.1 (the last OpenVINO release with MYRIAD/NCS2 support).
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
from openvino.runtime import AsyncInferQueue, Core, Model, opset8


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
    core, devices, props = core_and_device()
    emit({
        "ok": True,
        "device": "MYRIAD",
        "available_devices": devices,
        "device_name": props.get("full_device_name", "Intel Movidius Myriad X VPU"),
        "properties": props,
        "offline_capable": True,
        "runtime": "OpenVINO 2022.3.1",
    })


def build_benchmark_model():
    param = opset8.parameter([1, 3, 224, 224], np.float32, name="input")
    relu = opset8.relu(param)
    return Model([relu], [param], "magnanimous_ncs2_benchmark")


def benchmark(args):
    core, devices, props = core_and_device()
    count = max(10, min(1000, int(args.count)))
    jobs = max(1, min(8, int(args.jobs)))
    model = build_benchmark_model()
    compiled = core.compile_model(model, "MYRIAD")
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
        "ok": True,
        "device": "MYRIAD",
        "device_name": props.get("full_device_name", "Intel Movidius Myriad X VPU"),
        "count": count,
        "jobs": jobs,
        "sync": {
            "seconds": round(sync_seconds, 6),
            "avg_ms": round(sync_seconds * 1000 / count, 3),
            "throughput_per_sec": round(count / sync_seconds, 2),
        },
        "async": {
            "seconds": round(async_seconds, 6),
            "avg_ms": round(async_seconds * 1000 / count, 3),
            "throughput_per_sec": round(count / async_seconds, 2),
        },
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


def detect(args):
    from PIL import Image

    core, devices, props = core_and_device()
    image_path = Path(args.image).expanduser().resolve()
    model_path = Path(args.model).expanduser().resolve()
    if not image_path.is_file():
        raise RuntimeError("Input image does not exist.")
    if not model_path.is_file() or model_path.suffix.lower() != ".xml":
        raise RuntimeError("OpenVINO IR .xml model does not exist.")

    model = core.read_model(str(model_path))
    compiled = core.compile_model(model, "MYRIAD")
    inp = compiled.input(0)
    shape = [int(x) for x in inp.shape]
    if len(shape) != 4 or shape[0] != 1 or shape[1] != 3:
        raise RuntimeError(f"Expected NCHW image model, got input shape {shape}")
    _, _, height, width = shape

    image = Image.open(image_path).convert("RGB")
    original_w, original_h = image.size
    resized = image.resize((width, height))
    rgb = np.asarray(resized, dtype=np.uint8)
    bgr = rgb[:, :, ::-1]
    tensor = np.transpose(bgr, (2, 0, 1))[None, ...].astype(np.float32)

    t0 = time.perf_counter()
    result = compiled([tensor])
    elapsed = time.perf_counter() - t0

    outputs = {}
    for idx, port in enumerate(compiled.outputs):
        outputs[port_name(port, f"output_{idx}")] = np.asarray(result[port])

    boxes = None
    labels = None
    for name, arr in outputs.items():
        lower = name.lower()
        if "box" in lower or (arr.ndim >= 2 and arr.shape[-1] == 5):
            boxes = arr.reshape(-1, 5)
        elif "label" in lower or (arr.ndim <= 2 and np.issubdtype(arr.dtype, np.integer)):
            labels = arr.reshape(-1)

    if boxes is None or labels is None:
        summary = {name: list(arr.shape) for name, arr in outputs.items()}
        raise RuntimeError(f"Unsupported detector output layout: {summary}")

    threshold = max(0.0, min(1.0, float(args.threshold)))
    label_names = {0: "vehicle", 1: "person", 2: "bike_or_non_vehicle"}
    detections = []
    for box, label in zip(boxes, labels):
        x1, y1, x2, y2, conf = [float(x) for x in box]
        if conf < threshold:
            continue
        if max(abs(x1), abs(y1), abs(x2), abs(y2)) <= 2.0:
            ox1, ox2 = x1 * original_w, x2 * original_w
            oy1, oy2 = y1 * original_h, y2 * original_h
        else:
            ox1, ox2 = x1 * original_w / width, x2 * original_w / width
            oy1, oy2 = y1 * original_h / height, y2 * original_h / height
        lid = int(label)
        detections.append({
            "label_id": lid,
            "label": label_names.get(lid, f"class_{lid}"),
            "confidence": round(conf, 5),
            "box": [
                max(0, round(ox1, 1)),
                max(0, round(oy1, 1)),
                min(original_w, round(ox2, 1)),
                min(original_h, round(oy2, 1)),
            ],
        })

    emit({
        "ok": True,
        "device": "MYRIAD",
        "device_name": props.get("full_device_name", "Intel Movidius Myriad X VPU"),
        "image": str(image_path),
        "model": str(model_path),
        "threshold": threshold,
        "inference_ms": round(elapsed * 1000, 3),
        "input_shape": shape,
        "image_size": [original_w, original_h],
        "detection_count": len(detections),
        "detections": detections[:200],
        "available_devices": devices,
    })


def main():
    parser = argparse.ArgumentParser(description="Magnanimous NCS2 edge runtime")
    sub = parser.add_subparsers(dest="command", required=True)

    p_status = sub.add_parser("status")
    p_status.set_defaults(func=status)

    p_bench = sub.add_parser("benchmark")
    p_bench.add_argument("--count", type=int, default=100)
    p_bench.add_argument("--jobs", type=int, default=4)
    p_bench.set_defaults(func=benchmark)

    p_detect = sub.add_parser("detect")
    p_detect.add_argument("--image", required=True)
    p_detect.add_argument("--model", required=True)
    p_detect.add_argument("--threshold", type=float, default=0.5)
    p_detect.set_defaults(func=detect)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        emit({"ok": False, "error": f"{type(exc).__name__}: {exc}"})
        raise SystemExit(1)
