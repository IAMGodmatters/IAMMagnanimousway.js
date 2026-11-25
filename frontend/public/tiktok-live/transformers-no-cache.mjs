import * as core from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.0/dist/transformers.min.js";

// Keep neural voice model weights and WASM binaries out of persistent browser
// Cache Storage. The creator explicitly chooses this mode; weights are fetched
// for the current session and held in memory. This avoids filling a system drive
// through a hidden browser model cache. The trade-off is a fresh download next time.
core.env.useBrowserCache = false;
core.env.useWasmCache = false;
core.env.useFSCache = false;
core.env.cacheDir = null;
core.env.allowRemoteModels = true;
core.env.allowLocalModels = false;
const nativeFetch = globalThis.fetch.bind(globalThis);
core.env.fetch = (input, init = {}) => nativeFetch(input, { ...init, cache: "no-store" });

export const StyleTextToSpeech2Model = core.StyleTextToSpeech2Model;
export const AutoTokenizer = core.AutoTokenizer;
export const Tensor = core.Tensor;
export const env = core.env;
export const LogLevel = core.LogLevel;
