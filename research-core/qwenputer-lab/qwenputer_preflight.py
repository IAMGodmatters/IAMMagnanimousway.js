#!/usr/bin/env python3
"""Read-only hardware preflight for the optional Qwenputer research model.

This script never downloads weights, installs packages, or changes system settings.
"""
from __future__ import annotations

import argparse
import ctypes
import json
import os
import platform
import shutil
import subprocess
from pathlib import Path

REQUIRED_GPU_VRAM_GB = 24.0
CHECKPOINT_SIZE_GB = 18.8
RECOMMENDED_FREE_DISK_GB = 25.0


def physical_memory_bytes() -> int | None:
    try:
        if os.name == "nt":
            class MEMORYSTATUSEX(ctypes.Structure):
                _fields_ = [
                    ("dwLength", ctypes.c_ulong),
                    ("dwMemoryLoad", ctypes.c_ulong),
                    ("ullTotalPhys", ctypes.c_ulonglong),
                    ("ullAvailPhys", ctypes.c_ulonglong),
                    ("ullTotalPageFile", ctypes.c_ulonglong),
                    ("ullAvailPageFile", ctypes.c_ulonglong),
                    ("ullTotalVirtual", ctypes.c_ulonglong),
                    ("ullAvailVirtual", ctypes.c_ulonglong),
                    ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
                ]

            status = MEMORYSTATUSEX()
            status.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
            if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
                return int(status.ullTotalPhys)

        page_size = os.sysconf("SC_PAGE_SIZE")
        page_count = os.sysconf("SC_PHYS_PAGES")
        return int(page_size * page_count)
    except (AttributeError, OSError, ValueError):
        return None


def nvidia_gpus() -> list[dict[str, object]]:
    executable = shutil.which("nvidia-smi")
    if not executable:
        return []
    try:
        result = subprocess.run(
            [executable, "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"],
            check=True,
            capture_output=True,
            text=True,
            timeout=8,
        )
    except (OSError, subprocess.SubprocessError):
        return []

    devices: list[dict[str, object]] = []
    for line in result.stdout.splitlines():
        parts = [part.strip() for part in line.split(",", 1)]
        if len(parts) != 2:
            continue
        try:
            memory_gb = float(parts[1]) / 1024
        except ValueError:
            continue
        devices.append({"name": parts[0], "vram_gb": round(memory_gb, 2)})
    return devices


def existing_storage_path(path: str | Path) -> Path:
    """Resolve a requested checkpoint folder to its nearest existing parent."""
    candidate = Path(path).expanduser()
    while not candidate.exists() and candidate != candidate.parent:
        candidate = candidate.parent
    return candidate


def build_report(checkpoint_dir: str | Path | None = None) -> dict[str, object]:
    memory = physical_memory_bytes()
    requested_dir = Path(checkpoint_dir or os.environ.get("QWENPUTER_CHECKPOINT_DIR") or Path.home()).expanduser()
    storage_path = existing_storage_path(requested_dir)
    try:
        disk_free_gb = round(shutil.disk_usage(storage_path).free / (1024**3), 2)
    except OSError:
        disk_free_gb = None

    gpus = nvidia_gpus()
    best_gpu = max((float(gpu["vram_gb"]) for gpu in gpus), default=0.0)
    gpu_ready = best_gpu >= REQUIRED_GPU_VRAM_GB
    disk_ready = disk_free_gb is not None and disk_free_gb >= RECOMMENDED_FREE_DISK_GB
    capacity_ready = gpu_ready and disk_ready

    blockers: list[str] = []
    if not gpus:
        blockers.append("No NVIDIA GPU detected through nvidia-smi.")
    elif not gpu_ready:
        blockers.append(
            f"The largest detected NVIDIA GPU has {best_gpu:.2f} GB VRAM; "
            f"the main Qwenputer RISC-V checkpoint is documented for about "
            f"{REQUIRED_GPU_VRAM_GB:.0f} GB."
        )
    if not disk_ready:
        blockers.append(
            f"Free disk space is {disk_free_gb if disk_free_gb is not None else 'unknown'} GB; "
            f"keep at least {RECOMMENDED_FREE_DISK_GB:.0f} GB free before considering "
            "the 18.8 GB checkpoint."
        )

    return {
        "machine": platform.node(),
        "operating_system": platform.platform(),
        "processor": platform.processor() or platform.machine(),
        "system_ram_gb": round(memory / (1024**3), 2) if memory else None,
        "nvidia_gpus": gpus,
        "free_disk_gb": disk_free_gb,
        "checkpoint_directory": str(requested_dir),
        "disk_checked_path": str(storage_path),
        "requirements": {
            "main_checkpoint_size_gb": CHECKPOINT_SIZE_GB,
            "minimum_gpu_vram_gb": REQUIRED_GPU_VRAM_GB,
            "recommended_free_disk_gb": RECOMMENDED_FREE_DISK_GB,
        },
        "cpu_only_reference_tests_available": True,
        "capacity_preflight_passes": capacity_ready,
        "blockers": blockers,
        "safety": "Read-only preflight; no model download or paid compute is started.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON.")
    parser.add_argument("--checkpoint-dir", default=os.environ.get("QWENPUTER_CHECKPOINT_DIR", str(Path.home())), help="Folder or drive where model weights would be stored; nearest existing parent is checked.")
    args = parser.parse_args()
    report = build_report(args.checkpoint_dir)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print("MAGNANIMOUS AI • QWENPUTER LOCAL PREFLIGHT")
        print(f"Machine: {report['machine']}")
        print(f"OS: {report['operating_system']}")
        print(f"Processor: {report['processor']}")
        print(f"System RAM: {report['system_ram_gb']} GB")
        print(f"Checkpoint directory: {report['checkpoint_directory']}")
        print(f"Disk checked: {report['disk_checked_path']}")
        print(f"Free disk: {report['free_disk_gb']} GB")
        print(f"NVIDIA GPUs: {report['nvidia_gpus'] or 'none detected'}")
        print("CPU-only reference tests: AVAILABLE")
        print(f"GPU and disk capacity preflight passes: {'YES' if report['capacity_preflight_passes'] else 'NO'}")
        for blocker in report["blockers"]:
            print(f"BLOCKER: {blocker}")
        print(str(report["safety"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
