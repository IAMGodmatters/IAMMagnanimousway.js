import test from 'node:test';
import assert from 'node:assert/strict';
import { createLiveShowAutonomy } from './live-show-autonomy.mjs';

const scenes = ['Welcome', 'Chat', 'Game', 'Break'];

test('starts in manual mode and fails closed without explicit owner consent', () => {
  const control = createLiveShowAutonomy();
  assert.equal(control.status().mode, 'manual');
  assert.equal(control.status().enabled, false);
  assert.equal(control.enable({ permissions: ['host_speech'], modelReady: true }).status, 'consent_required');
});

test('requires a healthy local model for autonomous host speech', () => {
  const control = createLiveShowAutonomy();
  assert.equal(control.enable({ acknowledged: true, permissions: ['host_speech'], modelReady: false }).status, 'model_unavailable');
});

test('requires OBS connection and a scene allowlist for scene automation', () => {
  const control = createLiveShowAutonomy();
  assert.equal(control.enable({ acknowledged: true, permissions: ['obs_scene_switch'], obsConnected: false }).status, 'obs_unavailable');
  const invalid = control.enable({
    acknowledged: true, permissions: ['obs_scene_switch'], obsConnected: true,
    availableScenes: scenes, sceneMap: { game: 'Hidden Scene' }
  });
  assert.equal(invalid.status, 'scene_not_approved');
  const missing = control.enable({ acknowledged: true, permissions: ['obs_scene_switch'], obsConnected: true, availableScenes: scenes });
  assert.equal(missing.status, 'scene_map_required');
});

test('runs an explicitly enabled session with bounded permission and scene enforcement', () => {
  const control = createLiveShowAutonomy();
  const enabled = control.enable({
    acknowledged: true, permissions: ['host_speech', 'obs_scene_switch'],
    modelReady: true, obsConnected: true, availableScenes: scenes,
    sceneMap: { welcome: 'Welcome', chat: 'Chat', game: 'Game' }, durationMinutes: 10
  });
  assert.equal(enabled.status, 'enabled');
  assert.equal(control.status().mode, 'autonomous');
  assert.equal(control.authorize('moderate_chat').status, 'permission_denied');
  assert.equal(control.authorize('obs_scene_switch', { sceneName: 'Hidden Scene' }).status, 'scene_not_approved');
  assert.equal(control.sceneForCue('game_commentary'), 'Game');
  const allowed = control.authorize('obs_scene_switch', { sceneName: 'Game' });
  assert.equal(allowed.allowed, true);
  const receipt = control.complete(allowed.reservationId, 'succeeded', { detail: 'scene_changed' });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.receipt.action, 'obs_scene_switch');
  assert.equal(receipt.receipt.outcome, 'succeeded');
});

test('enforces six autonomous actions per minute and idempotently rejects unknown receipts', () => {
  let now = 1_700_000_000_000;
  const control = createLiveShowAutonomy({ now: () => now });
  control.enable({ acknowledged: true, permissions: ['host_speech'], modelReady: true, durationMinutes: 5 });
  const reservations = [];
  for (let i = 0; i < 6; i++) reservations.push(control.authorize('host_speech').reservationId);
  assert.equal(control.authorize('host_speech').status, 'rate_limited');
  assert.equal(control.complete('missing', 'succeeded').status, 'unknown_or_expired_receipt');
  now += 29_000;
  assert.equal(control.heartbeat().ok, true);
  now += 29_000;
  assert.equal(control.heartbeat().ok, true);
  now += 2_001;
  assert.equal(control.authorize('host_speech').allowed, true);
});

test('expires sessions and stops automatically when the control surface disappears', () => {
  let now = 1_700_000_000_000;
  const control = createLiveShowAutonomy({ now: () => now });
  control.enable({ acknowledged: true, permissions: ['host_speech'], modelReady: true, durationMinutes: 5 });
  now += 30_001;
  assert.equal(control.status().enabled, false);
  assert.equal(control.status().lastStop.reason, 'control_surface_disconnected');
  control.enable({ acknowledged: true, permissions: ['host_speech'], modelReady: true, durationMinutes: 5 });
  now += 5 * 60_000;
  assert.equal(control.status().enabled, false);
  assert.equal(control.status().lastStop.reason, 'session_expired');
});

test('emergency stop immediately revokes outstanding reservations', () => {
  const control = createLiveShowAutonomy();
  control.enable({ acknowledged: true, permissions: ['host_speech'], modelReady: true });
  const reserved = control.authorize('host_speech');
  assert.equal(reserved.allowed, true);
  assert.equal(control.stop('operator_emergency_stop').enabled, false);
  assert.equal(control.complete(reserved.reservationId, 'succeeded').status, 'unknown_or_expired_receipt');
});
