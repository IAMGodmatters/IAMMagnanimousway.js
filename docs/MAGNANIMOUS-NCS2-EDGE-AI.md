# Magnanimous NCS2 Edge AI

This integration makes an Intel Neural Compute Stick 2 (Movidius Myriad X VPU) a capability-scoped edge accelerator beneath **Magnanimous AI**.

## What it does

- `ncs2_status` — verifies the local OpenVINO/MYRIAD runtime.
- `ncs2_benchmark` — measures synchronous and asynchronous inference throughput.
- `ncs2_detect` — runs bounded image detection locally on the NCS2 using the installed Intel Open Model Zoo starter model.
- Capability Mesh routes:
  - `edge.ncs2.status`
  - `edge.ncs2.benchmark`
  - `edge.ncs2.detect`

## Hybrid online/offline model

The NCS2 performs inference locally. It does not require the internet once OpenVINO, the runtime script, and model files are installed.

When the I AM Magnanimous Way platform is online, Magnanimous AI can queue NCS2 work to a paired computer through the existing outbound-only Local Bridge. The computer polls over HTTPS; no inbound port or LAN listener is opened.

A phone can therefore use the NCS2 indirectly:

1. The phone talks to I AM Magnanimous Way / Magnanimous AI.
2. Magnanimous queues an edge task to the paired owner computer.
3. The NCS2 performs local inference.
4. Only the bounded result is returned to Magnanimous AI for reasoning, automation, logging, or follow-up.

This is useful for camera/image preprocessing, person/vehicle/bike detection, local filtering, and privacy-preserving edge decisions.

## ChatGPT / cloud AI boundary

The NCS2 cannot accelerate the ChatGPT cloud model, OpenAI inference servers, or a phone CPU. It can still improve the overall workflow by:

- offloading compatible computer-vision inference from the laptop CPU;
- preprocessing images locally before cloud reasoning;
- sending structured detections instead of full media when appropriate;
- enabling offline vision features when cloud AI is unavailable.

## Runtime version

NCS2 support is intentionally pinned to **OpenVINO 2022.3.1 LTS**, the final OpenVINO release line that supports the MYRIAD / Neural Compute Stick 2 plugin. Newer OpenVINO releases are not treated as an upgrade for this device because they removed NCS2 support.

## Installation on the owner computer

From the repository `local-bridge` directory, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-ncs2-edge.ps1
```

The installer uses the existing isolated NCS2 environment under `D:\NCS2_AI` with its isolated `venv` by default, installs Pillow, downloads the starter Intel Open Model Zoo detector, then verifies status and benchmark execution.

The Local Bridge advertises NCS2 capabilities only when it can detect the compatible runtime.
