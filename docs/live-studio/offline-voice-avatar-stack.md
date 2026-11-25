# Magnanimous Offline Voice and Avatar Stack

**Research checkpoint:** 25 November 2026  
**Status:** candidate architecture; no voice or portrait model is bundled or claimed operational until its exact files, license chain, native-speaker quality and target-device performance have been verified.

## Product rule

Magnanimous owns the creative direction, memory, persona, dialogue plan, safety policy and orchestration. Speech synthesis, phonemizers, avatar renderers, motion drivers, GPUs and media encoders are replaceable local capabilities. A provider must never become the identity of Magnanimous.

The same show must work in three modes:

1. **No-model mode:** the existing offline draft planner and operator-controlled recording remain usable.
2. **Local voice mode:** a user-selected, license-cleared TTS model runs on the device or USB workspace and sends audio to the local production graph.
3. **Avatar mode:** a selected 2D/3D avatar is animated locally from permitted expression, phoneme and motion data. The creator may use an abstract character, a licensed VRM, or their own likeness with consent.

The avatar is an optional presentation layer. Faceless creators must be able to use voice-only, captions-only, animated illustrations, or no synthetic host at all.

## Speech model and license assessment

| Candidate | Language coverage | Published license / constraints | Magnanimous decision |
| --- | --- | --- | --- |
| [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) | English, Spanish, French, Hindi, Italian, Japanese, Brazilian Portuguese and Mandarin Chinese | Model card identifies Apache-2.0 weights. The inference package, phonemizer, voice assets and all dependencies still need a separate bill of materials and license check. | Strong first candidate for local English and its supported languages; not a Filipino or Cebuano solution. Test on CPU and GPU before packaging. |
| [Filipino SpeechT5 ONNX export](https://huggingface.co/internetoftim/speecht5_tts-pld-fil-ONNX) | Filipino / Tagalog | Model card identifies MIT and a Transformers.js WebGPU/WASM path. It is an ONNX export of the SapinSapin Filipino SpeechT5 model. Confirm the upstream training-data, speaker embedding and dependency notices before redistribution. | Best current Filipino candidate to benchmark. Verify intelligibility, accent, code-switching and speaker consistency with native Filipino reviewers. |
| [Cebuano SpeechT5 v2](https://huggingface.co/Splintir/speecht5_tts-pld-ceb-v2) | Cebuano | Model card identifies MIT and documents a 14,007-clip fine-tune. It also reports speaker-conditioning failures across most tested native speaker embeddings. | Research candidate only. Do not make it the default voice; test a single-speaker variant and native-speaker samples before live use. |
| [Cebuano SpeechT5 single-speaker](https://huggingface.co/Splintir/speecht5_tts-pld-ceb-solo) | Cebuano, one speaker | Model card identifies MIT; it is fine-tuned on one speaker's 110 clips / about 15.5 minutes. This is not evidence of broad speaker coverage or a production-quality natural voice. | Controlled experiment only, with attribution and dataset/voice consent review. |
| [Meta MMS Cebuano TTS](https://huggingface.co/facebook/mms-tts-ceb) | Cebuano | CC BY-NC 4.0, non-commercial. | Exclude from commercial Magnanimous distributions. A separate non-commercial research test would need to remain isolated and clearly labelled. |
| [Piper Filipino voice](https://huggingface.co/IhorShevchuk/piper-voice-tl-filipino) | Filipino / Tagalog | CC BY-NC-SA 4.0; model card identifies the most restrictive license in its dependency chain. | Exclude from commercial Magnanimous distributions. |
| [Microsoft SpeechT5 base TTS](https://huggingface.co/microsoft/speecht5_tts) | General SpeechT5 architecture; language coverage depends on fine-tune and speaker embedding | MIT model weights. The base model is trained on LibriTTS; it is not a Filipino/Cebuano voice by itself. | Use as an architecture/dependency candidate, not as a ready-made local Filipino voice. |

### Language and quality gates

- A model's repository license is not a blanket license for its training recordings, speaker identity, phonemizer, vocoder, or bundled voice embeddings. Record each component and its provenance separately.
- Do not clone or imitate a real person's voice without explicit permission from that person and documented rights to the training audio.
- Never market an unreviewed model as a native-quality Cebuano or Filipino speaker. Use native-speaker review and a repeatable held-out test set.
- Score pronunciation, intelligibility, naturalness, code-switching, numbers, names, KJV/scripture terms where relevant, latency and CPU/GPU memory separately. Automated ASR error rates are a diagnostic, not a substitute for human listening.
- If a model's speaker conditioning produces silence, mumbling, unstable duration or wrong-language pronunciation, fail closed to text/captions or another approved voice.

## Avatar and real-time rendering

### Recommended foundation: VRM + Godot + OBS

- [VRM](https://vrm.dev/en/) is a humanoid avatar format built on glTF 2.0. Its metadata can carry author, redistribution and avatar-performance permissions. The import flow must read those permissions and refuse assets whose allowed use does not cover the creator's intended use.
- [Godot Engine](https://godotengine.org/license/) is MIT-licensed and can be used as a replaceable local renderer for a 2D/3D character, scene animations, expressions, audio buses and interaction cues. Preserve the MIT copyright notice when redistributing the engine.
- Godot is not the broadcast encoder. The production graph should render the avatar as a local window/transparent source and use OBS or another licensed media encoder for recording and authorized streaming. Godot's built-in video player is not a replacement for OBS media capture.
- Drive mouth animation from phoneme/viseme timing where available. If the selected TTS engine cannot expose timing, use a clearly approximate amplitude-driven mouth movement rather than claiming accurate lip-sync.
- Keep expressions and gestures in an allowlisted animation vocabulary: idle, listening, speaking, greeting, thinking, happy, concerned and neutral. Viewer text must never directly trigger arbitrary animation scripts or scene changes.

### Portrait animation is an optional offline render tool, not the live default

[LivePortrait](https://github.com/KlingAIResearch/LivePortrait) has MIT-licensed code, but its official license states that the included InsightFace detection models are for non-commercial research use and must be replaced for commercial use. Its official workflow uses portrait images plus driving video and produces rendered animation output; it requires Python, FFmpeg and model weights, and platform/GPU performance varies. Do not bundle its default detector weights in a commercial product, and do not describe it as a verified real-time live avatar engine. A commercial deployment requires a permissively licensed replacement detector, a full dependency audit and consent for the source portrait and driving footage.

## Local speech-to-avatar pipeline

1. Magnanimous prepares and reviews the host script; it identifies the language and marks uncertain names or pronunciations for correction.
2. A user-selected local TTS adapter generates audio and optional phoneme/viseme timing. The adapter reports its model ID, license manifest, language and runtime health.
3. The avatar renderer consumes only the audio and bounded expression cues. It cannot access platform credentials, chat moderation, payments or account controls.
4. The local production graph routes speech to the correct OBS audio bus, adds captions and synchronizes the avatar source.
5. The operator previews and approves the host segment. Broadcast start, platform posting, moderation and any consequential action remain separate approval-gated operations.
6. If the voice engine or renderer fails, the show falls back to text/captions, a static avatar, or a human voice. Recording and the rest of the studio continue.

## USB and offline distribution

- The USB SSD carries the project, voice/animation model files, asset licenses, SHA-256 hashes, runtime versions and per-device configuration.
- First-time model acquisition requires a network connection unless the model is preloaded by the publisher. After verified files are present, local inference must not require a model-host connection.
- Do not silently download gigabytes of models. Show the model size, license, language, device requirements and expected free space before installation.
- Keep model cache, temporary audio and render output on the selected workspace drive. Use a bounded cache and an explicit cleanup screen; never delete projects, recordings or user media automatically.
- Provide separate signed runtimes for Windows x64/ARM64, macOS Apple Silicon/Intel and Linux. A USB does not make a Windows executable or GPU runtime universal.
- Keep the speech/animation model separate from the encrypted project vault. Model weights are not user secrets; personal recordings, voice samples and likeness assets are private workspace data.

## Release gates before enabling a voice or avatar

- Exact model and dependency license manifest reviewed, including datasets, speaker embeddings, phonemizer, vocoder and redistributed binaries.
- Model hashes verified; no remote model fetch during offline use.
- Native-speaker pronunciation and intelligibility review for every advertised language.
- At least a 30-minute local rehearsal with no memory leak, audio drift, stuck GPU process or dropped output.
- CPU-only fallback tested where practical; unsupported devices receive a clear capability message, not a false ready state.
- Audio routing, captions, OBS scene transitions, recording and stop/recovery paths tested end to end.
- User consent and rights recorded for any real person's voice, face, portrait, driving video or avatar asset.
- Clear synthetic-media disclosure options and no impersonation of real people without permission.

## Current implementation status

- The Portable Creator has an offline draft planner, encrypted local project vault, local OBS WebSocket controls and the review-only show director.
- The local model interface can call a local GGUF server when one is installed and explicitly enabled; no local TTS engine or avatar renderer is currently claimed as installed or operational.
- The next implementation should be a small voice-adapter contract and offline device capability check, followed by one tested language/engine at a time. Do not download or bundle a model until the license and target-device tests pass.
