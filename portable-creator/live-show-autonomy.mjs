import { randomUUID } from 'node:crypto';

const PERMISSIONS = Object.freeze(['host_speech', 'obs_scene_switch']);
const SCENE_KEYS = Object.freeze(['chat', 'welcome', 'game', 'poll', 'audience', 'production']);
const MAX_SESSION_MS = 60 * 60 * 1000;
const MAX_ACTIONS_PER_MINUTE = 6;
const MAX_PENDING_ACTIONS = 12;
const MAX_HISTORY = 100;
const IDLE_LEASE_MS = 30_000;

function safeReason(value) {
  return String(value || 'operator_stop').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 100) || 'operator_stop';
}

/**
 * Owner-enabled, session-scoped live-show autonomy.
 * The controller authorizes bounded capabilities and records outcomes; it does
 * not itself send platform chat, moderate, spend money, or start/stop broadcasts.
 */
export function createLiveShowAutonomy({ now = () => Date.now() } = {}) {
  let session = null;
  const pending = new Map();
  const history = [];
  let actionTimes = [];

  const clock = () => {
    const value = now();
    return Number.isFinite(value) ? value : Date.now();
  };

  function stop(reason = 'operator_stop') {
    const stoppedAt = new Date(clock()).toISOString();
    const previous = session;
    if (previous) {
      history.push(Object.freeze({
        receiptId: randomUUID(),
        type: 'session_stopped',
        reason: safeReason(reason),
        stoppedAt,
        sessionId: previous.sessionId
      }));
      while (history.length > MAX_HISTORY) history.shift();
    }
    session = null;
    pending.clear();
    actionTimes = [];
    return status();
  }

  function expireOrIdle() {
    if (!session) return;
    const current = clock();
    if (current >= session.expiresAt) {
      stop('session_expired');
      return;
    }
    if (current - session.lastHeartbeatAt > IDLE_LEASE_MS) {
      stop('control_surface_disconnected');
    }
  }

  function enable({
    acknowledged,
    permissions,
    modelReady = false,
    obsConnected = false,
    sceneMap = {},
    availableScenes = [],
    durationMinutes = 30
  } = {}) {
    expireOrIdle();
    if (session) return { ok: false, status: 'already_enabled', detail: 'Stop the active takeover before changing its permissions.' };
    if (acknowledged !== true) return { ok: false, status: 'consent_required', detail: 'The owner must explicitly authorize AI takeover for this session.' };
    if (!Array.isArray(permissions) || permissions.length === 0 || permissions.some(value => !PERMISSIONS.includes(value))) {
      return { ok: false, status: 'invalid_permissions', detail: 'Choose at least one supported autonomy capability.' };
    }
    const selected = [...new Set(permissions)];
    if (selected.includes('host_speech') && modelReady !== true) {
      return { ok: false, status: 'model_unavailable', detail: 'Local AI must pass its health check before autonomous host speech can start.' };
    }
    const validScenes = new Set(Array.isArray(availableScenes) ? availableScenes.filter(value => typeof value === 'string' && value.trim()).map(value => value.slice(0, 128)) : []);
    const normalizedSceneMap = {};
    if (selected.includes('obs_scene_switch')) {
      if (obsConnected !== true) return { ok: false, status: 'obs_unavailable', detail: 'Connect local OBS before enabling autonomous scene changes.' };
      if (!sceneMap || typeof sceneMap !== 'object' || Array.isArray(sceneMap)) {
        return { ok: false, status: 'invalid_scene_map', detail: 'Choose approved OBS scenes for the show segments.' };
      }
      for (const key of SCENE_KEYS) {
        const name = sceneMap[key];
        if (name === '' || name == null) continue;
        if (typeof name !== 'string' || !validScenes.has(name)) {
          return { ok: false, status: 'scene_not_approved', detail: 'Every automatic scene must be selected from the current OBS scene list.' };
        }
        normalizedSceneMap[key] = name;
      }
      if (Object.keys(normalizedSceneMap).length === 0) {
        return { ok: false, status: 'scene_map_required', detail: 'Select at least one OBS scene that Magnanimous is allowed to use.' };
      }
    }
    const minutes = Number.isInteger(durationMinutes) ? Math.max(5, Math.min(60, durationMinutes)) : 30;
    const startedAt = clock();
    session = {
      sessionId: randomUUID(),
      mode: 'autonomous',
      startedAt,
      expiresAt: startedAt + minutes * 60_000,
      lastHeartbeatAt: startedAt,
      permissions: selected,
      sceneMap: normalizedSceneMap
    };
    pending.clear();
    actionTimes = [];
    return { ok: true, status: 'enabled', session: status() };
  }

  function heartbeat() {
    expireOrIdle();
    if (!session) return { ok: false, status: 'disabled' };
    session.lastHeartbeatAt = clock();
    return { ok: true, status: 'active' };
  }

  function authorize(action, details = {}) {
    expireOrIdle();
    if (!session) return { allowed: false, status: 'disabled' };
    session.lastHeartbeatAt = clock();
    if (!PERMISSIONS.includes(action) || !session.permissions.includes(action)) {
      return { allowed: false, status: 'permission_denied' };
    }
    const current = clock();
    actionTimes = actionTimes.filter(timestamp => current - timestamp < 60_000);
    if (actionTimes.length >= MAX_ACTIONS_PER_MINUTE) return { allowed: false, status: 'rate_limited' };
    let target = null;
    if (action === 'obs_scene_switch') {
      target = typeof details.sceneName === 'string' ? details.sceneName : '';
      if (!target || !Object.values(session.sceneMap).includes(target)) {
        return { allowed: false, status: 'scene_not_approved' };
      }
    }
    if (pending.size >= MAX_PENDING_ACTIONS) return { allowed: false, status: 'too_many_pending_actions' };
    const reservationId = randomUUID();
    pending.set(reservationId, { action, target, expiresAt: current + 60_000 });
    actionTimes.push(current);
    return { allowed: true, status: 'authorized', reservationId, action, target };
  }

  function complete(reservationId, outcome, details = {}) {
    expireOrIdle();
    if (typeof reservationId !== 'string' || !reservationId || reservationId.length > 80) return { ok: false, status: 'invalid_receipt' };
    const reserved = pending.get(reservationId);
    if (!reserved) return { ok: false, status: 'unknown_or_expired_receipt' };
    if (!['succeeded', 'failed', 'unavailable', 'skipped'].includes(outcome)) return { ok: false, status: 'invalid_outcome' };
    pending.delete(reservationId);
    const item = Object.freeze({
      receiptId: randomUUID(),
      reservationId,
      sessionId: session?.sessionId || null,
      type: 'action',
      action: reserved.action,
      outcome,
      target: reserved.target,
      detail: safeReason(details.detail || outcome),
      recordedAt: new Date(clock()).toISOString()
    });
    history.push(item);
    while (history.length > MAX_HISTORY) history.shift();
    return { ok: true, status: 'recorded', receipt: item };
  }

  function sceneForCue(kind) {
    expireOrIdle();
    if (!session || !session.permissions.includes('obs_scene_switch')) return null;
    const key = ({
      reply_prompt: 'chat',
      welcome: 'welcome',
      game_commentary: 'game',
      poll_update: 'poll',
      thank_you: 'audience',
      production_note: 'production'
    })[kind];
    return key ? (session.sceneMap[key] || null) : null;
  }

  function status() {
    expireOrIdle();
    if (!session) {
      const last = history.filter(item => item.type === 'session_stopped').slice(-1)[0] || null;
      return {
        enabled: false,
        mode: 'manual',
        permissions: [],
        approvedScenes: [],
        expiresAt: null,
        recentActions: history.slice(-20).reverse(),
        lastStop: last
      };
    }
    return {
      enabled: true,
      mode: 'autonomous',
      sessionId: session.sessionId,
      permissions: [...session.permissions],
      sceneMap: { ...session.sceneMap },
      approvedScenes: [...new Set(Object.values(session.sceneMap))],
      expiresAt: new Date(session.expiresAt).toISOString(),
      remainingMs: Math.max(0, session.expiresAt - clock()),
      recentActions: history.slice(-20).reverse()
    };
  }

  return Object.freeze({ enable, stop, heartbeat, authorize, complete, sceneForCue, status });
}
