# Qwenputer research lab

This is an optional, local-first research package for Magnanimous AI. It studies the
Qwenputer idea without copying or vendoring its implementation and without changing
Magnanimous AI's production reasoning, memory, tool routing, or execution engine.

## What is included

- A read-only hardware preflight for the main Qwenputer RISC-V checkpoint.
- A small Python reference model for the one-hot row-overwrite memory abstraction.
- Deterministic tests, including 100,000 randomized writes against ordinary byte memory.
- A PowerShell runner for Windows.

The reference model is intentionally small. It tests the RAM abstraction, not a
transformer, full Gated DeltaNet implementation, RISC-V CPU, C runtime, or the upstream
Qwenputer checkpoint. Passing these tests does **not** reproduce or independently
validate the upstream project's full benchmarks.

## Run on Windows

From PowerShell:

`powershell
cd "$HOME\Documents\MagnanimousResearch\qwenputer-lab"
.\run-local-checks.ps1
`

The `--checkpoint-dir` option checks the selected model-storage volume, not automatically just the Windows system drive. The folder does not need to exist yet; the nearest existing parent drive is checked. The PowerShell wrapper accepts the same setting with `-CheckpointDirectory`.

Or run the individual checks:

`powershell
python .\qwenputer_preflight.py --checkpoint-dir 'D:\Qwenputer\models'
python -m unittest discover -s .\tests -v
`

Both checks use only the Python standard library. They do not download model weights,
install dependencies, provision a GPU, or make network requests.

## Full upstream model requirements

The main RV32 Qwenputer checkpoint is approximately **18.8 GB** and the developer
documents a **24 GB NVIDIA GPU** for the full model. Keep at least **25 GB free disk**
before attempting a download. The exact execution stack also requires the upstream
driver, Triton/CUDA-compatible GPU support, and BF16 precision safeguards. Do not
attempt to run it on a system that fails the preflight.

The local preflight never downloads anything. It reports readiness only; it is not a
benchmark or a guarantee of compatibility.

## Reproduce the upstream project on suitable hardware

Review the upstream README and license first. The project's code is described as MIT
and its modified Qwen model weights as Apache-2.0. Verify the current license files
before redistribution or commercial use.

`bash
git clone https://github.com/divagr18/qwenputer
cd qwenputer/experimental/riscv
uv sync --extra hf
hf download divagr1925/Qwen3.5-4B-Qwenputer --local-dir qwenputer-rv
uv run python -m chipformer.rv.chat qwenputer-rv --firmware tests/data/rv/calc-bridge.elf --ask "Use calc: what is 123456789 * 987654321?"
`

For deterministic reproduction, follow the upstream instructions, including
`torch.backends.cuda.matmul.allow_bf16_reduced_precision_reduction = False`
and batch-size constraints documented by the project.

## Source material

- Upstream code: https://github.com/divagr18/qwenputer
- Developer's technical article: https://divagr.com/blog/qwenputer
- Model weights: https://huggingface.co/divagr1925/Qwen3.5-4B-Qwenputer
- Gated DeltaNet background: https://arxiv.org/abs/2412.06464
- Independent implementation to watch: https://huggingface.co/suayptalha/LFMputer-1.7B
- Full research brief: https://agent.tinyfish.ai/playground/research/share/01a1a184-17ad-7fd7-af31-efad4c962b30

## Magnanimous integration boundary

Qwenputer remains a replaceable external research project. Magnanimous AI remains the
platform's brain and orchestration authority. No production request is dispatched to
Qwenputer, no model is downloaded automatically, and no GPU or paid compute is started.
Any future adapter must be explicitly enabled, isolated, resource-limited, independently
benchmarked, and must fall back to Magnanimous's existing verified execution path.
