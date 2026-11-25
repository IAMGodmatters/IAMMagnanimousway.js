'use client';

import { useEffect, useRef, useState } from 'react';

type Local3DAvatarProps = { textToSpeak: string };
type DynamicModule = Record<string, any>;
type TalkingHeadInstance = {
  showAvatar: (options: { url: string; body?: string; avatarMood?: string; lipsyncLang?: string }) => Promise<void>;
  speakAudio: (audio: any, options?: { lipsyncLang?: string }, onSubtitles?: (word: string) => void) => void;
  stopSpeaking?: () => void;
  dispose?: () => void;
};
type HeadTTSInstance = {
  connect: (settings?: unknown, onProgress?: (event: any) => void, onError?: (error: any) => void) => Promise<void>;
  setup: (settings: { voice: string; language: string; speed: number; audioEncoding: string }) => Promise<void>;
  synthesize: (request: { input: string }) => Promise<Array<{ type: string; data: any }>>;
  disconnect?: () => void;
};

const TALKING_HEAD_MODULE = 'https://cdn.jsdelivr.net/npm/@met4citizen/talkinghead@1.8.2/modules/talkinghead.mjs';
const HEAD_TTS_MODULE = 'https://cdn.jsdelivr.net/npm/@met4citizen/headtts@1.4.0/modules/headtts.mjs';
const MPFB_CC0_DOWNLOAD = 'https://raw.githubusercontent.com/met4citizen/TalkingHead/main/avatars/mpfb.glb';
const MAX_AVATAR_BYTES = 80 * 1024 * 1024;

async function loadRemoteModule(url: string): Promise<DynamicModule> {
  // The imports are user-triggered and intentionally remain native browser ESM
  // imports. Three.js module specifiers are resolved by the root import map.
  return import(/* webpackIgnore: true */ url) as Promise<DynamicModule>;
}

export default function Local3DAvatar({ textToSpeak }: Local3DAvatarProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<TalkingHeadInstance | null>(null);
  const ttsRef = useRef<HeadTTSInstance | null>(null);
  const modelObjectUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const [modelUrl, setModelUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState('Choose a GLB avatar model to begin.');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try { headRef.current?.stopSpeaking?.(); } catch {}
      try { headRef.current?.dispose?.(); } catch {}
      try { ttsRef.current?.disconnect?.(); } catch {}
      if (modelObjectUrlRef.current) URL.revokeObjectURL(modelObjectUrlRef.current);
    };
  }, []);

  function chooseAvatar(file?: File) {
    setError('');
    setAvatarReady(false);
    setVoiceReady(false);
    try { headRef.current?.stopSpeaking?.(); } catch {}
    try { headRef.current?.dispose?.(); } catch {}
    headRef.current = null;
    try { ttsRef.current?.disconnect?.(); } catch {}
    ttsRef.current = null;
    if (modelObjectUrlRef.current) {
      URL.revokeObjectURL(modelObjectUrlRef.current);
      modelObjectUrlRef.current = null;
    }
    if (!file) {
      setModelUrl('');
      setModelName('');
      setStatus('Choose a GLB avatar model to begin.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.glb') || file.size === 0 || file.size > MAX_AVATAR_BYTES) {
      setError('Choose a valid .glb avatar file under 80 MB.');
      setModelUrl('');
      setModelName('');
      return;
    }
    const localUrl = URL.createObjectURL(file);
    modelObjectUrlRef.current = localUrl;
    setModelUrl(localUrl);
    setModelName(file.name);
    setStatus('Avatar selected locally. It has not been uploaded to Magnanimous.');
  }

  async function loadAvatar() {
    if (!modelUrl || !mountRef.current || loading) return;
    setLoading(true);
    setError('');
    setProgress('');
    setStatus('Loading the 3D renderer…');
    try {
      const module = await loadRemoteModule(TALKING_HEAD_MODULE);
      if (!mountedRef.current || !mountRef.current) return;
      const TalkingHead = module.TalkingHead as new (mount: HTMLElement, options: Record<string, unknown>) => TalkingHeadInstance;
      if (typeof TalkingHead !== 'function') throw new Error('The 3D avatar module did not expose TalkingHead.');
      const head = new TalkingHead(mountRef.current, {
        modelPixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        modelFPS: 30,
        cameraView: 'upper',
        cameraRotateEnable: false,
        cameraPanEnable: false,
        cameraZoomEnable: false,
        lipsyncModules: ['en'],
        avatarMood: 'neutral',
        avatarSpeakingEyeContact: 0.8,
        avatarSpeakingHeadMove: 0.45,
        avatarIdleEyeContact: 0.35,
        avatarIdleHeadMove: 0.3,
        dracoEnabled: false
      });
      await head.showAvatar({ url: modelUrl, body: 'M', avatarMood: 'neutral', lipsyncLang: 'en' });
      if (!mountedRef.current) {
        try { head.dispose?.(); } catch {}
        return;
      }
      headRef.current = head;
      setAvatarReady(true);
      setStatus('3D avatar ready. Prepare the optional local neural voice to lip-sync Magnanimous replies.');
    } catch (e: any) {
      setError(e?.message || 'Could not load this GLB avatar. Check its rig and blend-shape compatibility.');
      setStatus('3D avatar could not load.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function prepareNeuralVoice() {
    if (!avatarReady || voiceReady || loading) return;
    setLoading(true);
    setError('');
    setProgress('Starting the local voice worker…');
    setStatus('Loading optional neural voice. Model weights stay in memory; persistent browser model caching is disabled.');
    try {
      const module = await loadRemoteModule(HEAD_TTS_MODULE);
      if (!mountedRef.current) return;
      const HeadTTS = module.HeadTTS as new (options: Record<string, unknown>, onError?: (error: any) => void) => HeadTTSInstance;
      if (typeof HeadTTS !== 'function') throw new Error('The local voice module did not expose HeadTTS.');
      const tts = new HeadTTS({
        endpoints: ['webgpu', 'wasm'],
        transformersModule: '/tiktok-live/transformers-no-cache.mjs',
        dictionaryURL: 'https://cdn.jsdelivr.net/npm/@met4citizen/headtts@1.4.0/dictionaries',
        voiceURL: 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices',
        languages: ['en-us'],
        defaultVoice: 'af_bella',
        defaultLanguage: 'en-us',
        defaultSpeed: 1,
        defaultAudioEncoding: 'wav',
        audioSampleRate: 24000
      }, (e: any) => {
        if (mountedRef.current) setError(e?.message || 'The local neural voice worker reported an error.');
      });
      await tts.connect(null, (event: any) => {
        if (mountedRef.current) {
          const loaded = Number(event?.loaded || 0);
          const total = Number(event?.total || 0);
          setProgress(total > 0 ? `Loading neural voice ${Math.round(loaded / total * 100)}%` : 'Loading neural voice and language data…');
        }
      }, (e: any) => {
        if (mountedRef.current) setError(e?.message || 'Neural voice worker failed.');
      });
      await tts.setup({ voice: 'af_bella', language: 'en-us', speed: 1, audioEncoding: 'wav' });
      if (!mountedRef.current) {
        try { tts.disconnect?.(); } catch {}
        return;
      }
      ttsRef.current = tts;
      setVoiceReady(true);
      setProgress('Local neural voice is ready. No provider API minutes are being consumed.');
      setStatus('3D avatar and local neural voice are ready.');
    } catch (e: any) {
      setError(e?.message || 'The local neural voice could not initialize. WebGPU may be unavailable; try again on a current desktop browser.');
      setStatus('Neural voice unavailable. The existing browser voice remains available above.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function speakCurrentReply() {
    const head = headRef.current;
    const tts = ttsRef.current;
    const text = String(textToSpeak || '').trim().slice(0, 450);
    if (!head || !tts || !text || speaking) return;
    setError('');
    setSpeaking(true);
    setStatus('Magnanimous reply is being voiced and lip-synced locally…');
    try {
      const messages = await tts.synthesize({ input: text });
      if (!mountedRef.current) return;
      const audio = messages.filter(message => message.type === 'audio');
      if (!audio.length) {
        const failed = messages.find(message => message.type === 'error');
        throw new Error(failed?.data?.error || 'The local voice returned no audio.');
      }
      for (const message of audio) {
        if (!mountedRef.current || !headRef.current) break;
        head.speakAudio(message.data, { lipsyncLang: 'en' });
      }
      setStatus('Local 3D host is speaking the Magnanimous answer.');
    } catch (e: any) {
      setError(e?.message || 'The local 3D voice could not speak this reply.');
      setStatus('Local voice needs attention.');
    } finally {
      if (mountedRef.current) setSpeaking(false);
    }
  }

  function stop() {
    try { headRef.current?.stopSpeaking?.(); } catch {}
    setSpeaking(false);
    setStatus(voiceReady ? '3D avatar and local neural voice are ready.' : '3D avatar is ready.');
  }

  return (
    <section className="localAvatar" aria-label="Free local 3D avatar studio">
      <div className="localAvatarHead">
        <div><small>FREE-FIRST NATIVE AVATAR</small><h3>Build your faceless 3D host</h3></div>
        <span className={avatarReady ? 'ready' : ''}>{avatarReady ? '3D READY' : 'LOCAL PREVIEW'}</span>
      </div>
      <p className="localAvatarCopy">Use your own licensed GLB character. The model stays in this browser tab; it is not uploaded to Magnanimous. TalkingHead renders the 3D character and HeadTTS supplies neural speech with word/viseme timing. The optional voice downloads model files for this session but has persistent browser model caching disabled.</p>
      <div className="localAvatarControls">
        <label className="fileButton">Choose 3D avatar (.glb)
          <input type="file" accept=".glb,model/gltf-binary" onChange={event => chooseAvatar(event.target.files?.[0])} />
        </label>
        <span className="modelName">{modelName || 'No avatar file selected'}</span>
        <button type="button" onClick={loadAvatar} disabled={!modelUrl || loading || avatarReady}>{loading ? 'LOADING…' : avatarReady ? 'AVATAR LOADED' : 'LOAD 3D AVATAR'}</button>
      </div>
      <div className="avatarCanvas" ref={mountRef}>
        {!avatarReady && <div className="avatarEmpty"><b>3D avatar preview</b><span>Choose a compatible GLB file to display your character here.</span></div>}
      </div>
      <div className="localAvatarControls">
        <button type="button" onClick={prepareNeuralVoice} disabled={!avatarReady || voiceReady || loading}>{voiceReady ? 'LOCAL VOICE READY' : 'PREPARE LOCAL NEURAL VOICE'}</button>
        <button type="button" onClick={speakCurrentReply} disabled={!voiceReady || !textToSpeak.trim() || speaking}>{speaking ? 'SPEAKING…' : 'SPEAK MAGNANIMOUS REPLY'}</button>
        <button type="button" className="stopLocal" onClick={stop} disabled={!speaking}>STOP</button>
      </div>
      <p className="localAvatarStatus" role="status">{status}{progress ? ` • ${progress}` : ''}</p>
      {error && <p className="localAvatarError" role="alert">{error}</p>}
      <p className="localAvatarNote">Hardware note: WebGPU is preferred; WASM is the slower fallback. The neural voice is English-only. First-time model loading uses RAM and network bandwidth. Browser model caches are disabled to avoid a hidden storage build-up; this means the voice model downloads again in a later session. For a persistent CPU voice kept on a data drive, use the Pocket TTS local-bridge route when your Windows computer is online.</p>
      <div className="techLinks"><a href={MPFB_CC0_DOWNLOAD} target="_blank" rel="noreferrer">Download the CC0 sample avatar (about 36 MB)</a><a href="https://github.com/met4citizen/TalkingHead/blob/main/blender/MPFB/MPFB.md" target="_blank" rel="noreferrer">Create your own CC0 avatar with MPFB</a><a href="https://github.com/met4citizen/TalkingHead" target="_blank" rel="noreferrer">TalkingHead source and license</a><a href="https://github.com/met4citizen/HeadTTS" target="_blank" rel="noreferrer">HeadTTS source and license</a></div>
      <style jsx>{`
        .localAvatar{margin:14px 0 10px;padding:15px;border:1px solid #315265;border-radius:15px;background:linear-gradient(145deg,#0b1a27,#061019);color:#e8f7ff}
        .localAvatarHead{display:flex;align-items:center;justify-content:space-between;gap:12px}.localAvatarHead small{font-size:9px;letter-spacing:.15em;color:#6de2f4}.localAvatarHead h3{font-size:16px;margin:5px 0 0}.localAvatarHead span{font-size:8px;font-weight:900;letter-spacing:.12em;color:#c5a86c;border:1px solid #5d4b2b;border-radius:99px;padding:6px 8px}.localAvatarHead span.ready{color:#8ee6b1;border-color:#397a56}
        .localAvatarCopy,.localAvatarNote{color:#94aebd;font-size:10px;line-height:1.6}.localAvatarControls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0}.localAvatarControls button,.fileButton{border:1px solid #31677b;border-radius:8px;padding:9px 11px;background:#102e3b;color:#c8f5ff;font-size:9px;font-weight:900;letter-spacing:.04em;cursor:pointer}.localAvatarControls button:disabled{opacity:.45;cursor:not-allowed}.localAvatarControls .stopLocal{background:#311e25;color:#ffbac2;border-color:#6b3b45}.fileButton{display:inline-flex;align-items:center;position:relative;overflow:hidden}.fileButton input{position:absolute;inset:0;opacity:0;cursor:pointer}.modelName{font-size:9px;color:#90a7b4;overflow-wrap:anywhere}.avatarCanvas{width:100%;height:330px;position:relative;overflow:hidden;border-radius:11px;border:1px solid #203b4b;background:radial-gradient(circle at 50% 30%,#173a4b,#050c14 73%)}.avatarEmpty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;text-align:center;padding:20px;color:#9cb6c3;font-size:11px}.avatarEmpty b{font-size:15px;color:#e7cb88}.localAvatarStatus{font-size:10px;color:#8fe1ed;line-height:1.5}.localAvatarError{font-size:10px;color:#ffbac2;line-height:1.5}.techLinks{display:flex;flex-wrap:wrap;gap:12px}.techLinks a{color:#83e1f1;font-size:9px;text-decoration:underline;text-underline-offset:3px}
      `}</style>
    </section>
  );
}
