# Magnanimous NCS2 Edge AI

This integration makes an Intel Neural Compute Stick 2 (Movidius Myriad X VPU) a capability-scoped edge accelerator beneath **Magnanimous AI**.

## Live capabilities

- `ncs2_status` - verifies the local OpenVINO/MYRIAD runtime.
- `ncs2_benchmark` - measures synchronous and asynchronous inference throughput.
- `ncs2_detect` - bounded person/vehicle/bike detection.
- `ncs2_media_triage` - local image preflight with dimensions, orientation, brightness, contrast, sharpness proxy, quality heuristic and detections.
- `ncs2_batch_scan` - bounded folder scan that compiles the model once and ranks image candidates.
- `ncs2_video_scan` - samples a bounded number of video frames with portable FFmpeg and returns candidate timestamps plus detections.
- `ncs2_face_detect` - **face presence/boxes only** for framing and composition; no identity, emotion, age, gender or demographic inference.
- `ncs2_text_regions` - locates text regions before a separate OCR/transcription step.

Capability Mesh routes are `edge.ncs2.status`, `edge.ncs2.benchmark`, `edge.ncs2.detect`, `edge.ncs2.triage`, `edge.ncs2.batch_scan`, `edge.ncs2.video_scan`, `edge.ncs2.face_detect`, and `edge.ncs2.text_regions`.

## Useful I AM Magnanimous Way workflows

The NCS2 is a local **vision coprocessor**, not a general LLM accelerator. Good uses include:

- preflight ministry/social images and thumbnails before a cloud model sees them;
- rank local pictures for reels, posts and publishing artwork;
- sample a reel/video and find candidate moments without uploading the whole video first;
- detect whether faces are present for crop/framing decisions without identifying anyone;
- find text regions in screenshots, scanned pages and visual email attachments before OCR;
- batch-triage owner files while offline;
- return compact structured results to Magnanimous AI, which can then decide whether cloud reasoning is necessary.

Email and social workflows remain account/authorization scoped. Magnanimous may use the NCS2 to analyze an authorized local or downloaded visual attachment, but **sending email, publishing a post, deleting data, changing an account, spending money, or any other consequential external mutation still uses the platform's existing permission and confirmation gates**.

## Hybrid online/offline model

The NCS2 performs inference locally. It does not require the internet once OpenVINO, the runtime script, model files and the portable FFmpeg dependency are installed.

When I AM Magnanimous Way is online, Magnanimous AI can queue NCS2 work to a paired computer through the existing outbound-only Local Bridge. The computer polls over HTTPS; no inbound port or LAN listener is opened.

A phone can therefore use the NCS2 indirectly:

1. The phone talks to I AM Magnanimous Way / Magnanimous AI.
2. Magnanimous queues an edge task to the paired owner computer.
3. The NCS2 performs local inference.
4. Only the bounded result is returned to Magnanimous AI for reasoning, automation, logging, or follow-up.

## ChatGPT / cloud AI boundary

The NCS2 **cannot accelerate the ChatGPT cloud model**, OpenAI inference servers, or a phone CPU. It can improve the overall workflow by offloading compatible computer-vision inference from the laptop CPU, preprocessing visual media locally, reducing unnecessary uploads, and enabling offline vision tasks.

## Runtime version

The preferred runtime is **OpenVINO 2022.3.2 LTS**. Intel describes 2022.3.2 as a functional/security bug-fix release over 2022.3.1 and explicitly states that Intel Movidius VPU-based products are supported. Newer OpenVINO generations removed MYRIAD/NCS2 support, so this integration intentionally remains on the compatible 2022.3 LTS line.

The owner PC keeps the previous 2022.3.1 stack available as a rollback fallback; promotion to 2022.3.2 was accepted only after MYRIAD status, benchmark, image, batch, video, face-box and text-region tests passed on the physical stick.

## Installation on the owner computer

From the repository `local-bridge` directory, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-ncs2-edge.ps1
```

The installer defaults to `D:\NCS2_AI\venv232`, uses OpenVINO 2022.3.2, installs Pillow plus portable `imageio-ffmpeg`, provisions the bounded Intel Open Model Zoo models, and verifies status and benchmark execution.

The Local Bridge advertises only NCS2 capabilities backed by files that are actually present on the owner computer.
