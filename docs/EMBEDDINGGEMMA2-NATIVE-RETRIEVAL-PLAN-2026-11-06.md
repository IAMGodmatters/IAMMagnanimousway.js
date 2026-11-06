# EmbeddingGemma 2 integration plan — 2026-11-06

## Decision

Evaluate Google EmbeddingGemma 2 as an optional, replaceable embedding engine for Magnanimous-owned retrieval. Do not make it the brain, memory authority, database, or a required cloud dependency. Keep current keyword search and existing vector-store behavior as working fallbacks.

This is an engineering plan and evidence record only. It does not enable a provider, download model weights, add dependencies, create a paid account, change production configuration, or run ingestion.

## Verified model facts

Official Google documentation identifies EmbeddingGemma 2 as an Apache 2.0 multimodal embedding model with 740M total parameters and a shared 768-dimensional embedding space. Its modular configurations include a 270M text/code configuration, 440M text+vision, 570M text+audio, and 740M full multimodal configuration. It supports text, code, images, video, and audio. Google documents 8,192-token context and Matryoshka output dimensions of 768, 512, 256, and 128.

Important corrections to shorthand in the November newsletter:
- 270M refers to the text/code configuration, not the complete multimodal model.
- The newsletter's approximate RAM figure must not be treated as a guaranteed runtime requirement; actual memory depends on implementation, precision, modality encoders, batch size, and hardware.
- The model is an embedding model, not a chat/reasoning model. It returns vectors; Magnanimous remains responsible for reasoning, authorization, synthesis, and decisions.
- The model card warns that it is not safety-aligned as a generative assistant. Retrieved content must remain untrusted data and cannot grant tool permissions.

Primary sources:
- https://ai.google.dev/gemma/docs/embeddinggemma/model_card_2
- https://developers.googleblog.com/embeddinggemma-2-the-developer-guide/
- https://ai.google.dev/gemma/docs/embeddinggemma/inference-embeddinggemma-with-sentence-transformers
- https://ai.google.dev/gemma/docs/embeddinggemma/multimodal-embeddinggemma-with-sentence-transformers

## Existing Magnanimous baseline observed on main

At base commit `9feeb962bcb857f3c9b3eda085e826d8442dc921`:
- `worker/src/knowledge-runtime.js` implements tenant-scoped knowledge sources/chunks and FTS5 keyword retrieval.
- `magnanimous-runtime/src/vector-store.mjs` implements a SQLite-backed cosine vector store with namespace separation, metadata filters, and configurable dimensions.
- `worker/src/magnanimous-brain-memory-skills.js` already establishes provenance-first knowledge engineering, tenant isolation, conflict handling, privacy-aware consolidation, evaluation replay, and Capability Mesh authorization.
- `worker/migrations/0049_magnanimous_research_memory.sql` provides tenant-scoped research memory tables.

The current Worker knowledge path shown in the inspected source is keyword/FTS retrieval. The separately located SQLite vector-store file does not by itself prove that the production Worker knowledge endpoint is using semantic embeddings. Do not claim semantic search is live until the actual call path and production behavior are verified.

## Recommended implementation shape

1. **Preserve current path.** Keep FTS5 keyword retrieval available and unchanged. Add semantic retrieval as an optional second retrieval channel, not a replacement.
2. **Provider-neutral interface.** Define a small embedding adapter contract owned by Magnanimous:
   - `embedDocuments(items, { task: "document", dimensions, signal })`
   - `embedQuery(text, { task: "query", dimensions, signal })`
   - response includes vectors, model/provider identifier, dimensions, normalization status, and usage/latency metadata.
   Keep provider selection behind existing configuration and capability authorization.
3. **Local-first inference.** First prototype the 270M text/code configuration on a developer-controlled computer or isolated runner. Do not attempt to load PyTorch/model weights inside the Cloudflare Worker. The Worker should only call a separately configured inference adapter if later approved and cost/security tested.
4. **Dimension consistency.** Store model ID, model revision, modality, dimension, task prefix/version, and normalization status with each vector. Never compare vectors from incompatible model revisions or dimensions. Query and document embeddings must use matching dimensions and task instructions.
5. **Start at 256 dimensions only after evaluation.** Google documents 256d as a storage-saving option with strong retained quality, but this must be benchmarked against Magnanimous's own data. Keep 768d available for multimodal retrieval. Do not select 128d without workload-specific evidence. Re-normalize after any truncation before cosine similarity.
6. **Hybrid retrieval.** Fuse FTS5 and vector results using a tested rank-fusion method, deduplicate by source/chunk, then rerank only when an approved local or funded provider is available. Include source citations and index-health metadata in results.
7. **Privacy and lifecycle.** Enforce tenant/client/app scope before candidate retrieval and again before returning results. Do not embed private email, call recordings, user files, or connected-app content unless the existing connector authorization, consent, retention, and deletion rules permit it. Deletion/withdrawal must remove both source chunks and derived vectors.
8. **Fail closed to existing search.** On model unavailable, timeout, malformed vector, dimension mismatch, or quota/cost limit, log a bounded diagnostic and continue with current FTS retrieval. Never block core knowledge access on the new model.
9. **No automatic paid use.** No Gemini API, Vertex AI, Cloud Run, paid hosting, or paid model endpoint is enabled by this plan. Local evaluation must not download weights without checking disk space, hardware suitability, model license, and explicit operator capacity.

## Prototype acceptance gates

Run only on synthetic or explicitly approved, non-sensitive fixtures.

- Relevance: compare FTS-only against FTS+semantic on a fixed query set; report Recall@5, MRR@10, and nDCG@10.
- Code search: test natural-language queries against a pinned, non-secret source fixture.
- Cross-modal phase: defer until text/code evaluation passes; use synthetic images/audio/video and test modality-specific behavior.
- Correctness: reject NaN/Infinity, empty vectors, incompatible dimensions, unnormalized truncated vectors, and mismatched model revisions.
- Isolation: prove tenant A cannot retrieve tenant B's sources or vectors, including metadata-filter and hybrid-fusion paths.
- Deletion: prove source withdrawal deletes chunks, FTS rows, vectors, and derived references.
- Reliability: model timeout/unavailable must return useful FTS results without retry loops.
- Cost: demonstrate zero paid provider calls in local prototype; enforce explicit caps before any remote provider experiment.
- Performance: record cold start, warm latency, peak RAM/VRAM, index build time, and storage footprint on actual target hardware.
- Regression: current knowledge routes, permissions, citations, and existing UI remain unchanged.

## Immediate next engineering step

Audit all call sites of `MagnanimousVectorStore`, the Worker knowledge route registration, and current knowledge retrieval tests. Then build an isolated local text/code benchmark adapter and fixture suite. Only after the benchmark passes should a separate implementation PR wire semantic retrieval behind a disabled-by-default feature flag.

## Explicit non-goals

- Do not replace Magnanimous identity, brain, or memory ownership with Google.
- Do not replace the existing FTS path or existing working features.
- Do not introduce a required Google account, API key, billing account, or external service.
- Do not ingest private user/customer data for benchmarking.
- Do not deploy or enable this prototype in production as part of the research step.
