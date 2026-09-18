# Magnanimous Music Engine

This service is the self-hosted audio-generation adapter for Magnanimous Music Studio. Magnanimous remains the public brain and product identity.

## Engine
The default implementation uses ACE-Step 1.5 through its local Python/Transformers interface. The model is MIT licensed and its model card states commercial use of generated music is supported. The engine is intentionally isolated behind the Magnanimous adapter contract so it can be upgraded or replaced without changing the product identity.

## Runtime
This is a GPU-oriented service. Deploy it on a machine/container with Python, PyTorch and the model dependencies installed. Set:

- `MUSIC_ENGINE_MODEL=ACE-Step/Ace-Step1.5`
- `MUSIC_ENGINE_TOKEN=<private shared token>`
- `MUSIC_ENGINE_OUTPUT_DIR=/data/music`

The public Cloudflare worker should receive only:
- `MUSIC_ENGINE_URL=<private engine base URL>`
- `MUSIC_ENGINE_TOKEN=<same private shared token>`

Never expose the engine token in the browser.

## Contract
- `GET /health`
- `POST /v1/generate`
- `GET /v1/audio/{filename}`

Generation accepts `prompt`, optional `lyrics`, `duration`, and `instrumental`. The service returns a generated WAV filename and download path.

## Rights
Do not use reference audio, voices, covers, or protected source material without the required rights and consent. Magnanimous must preserve the platform rights ledger before forwarding those operations to any engine.
