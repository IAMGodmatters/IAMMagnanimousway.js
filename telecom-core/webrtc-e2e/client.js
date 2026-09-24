import { Inviter, Registerer, RegistererState, SessionState, UserAgent } from "sip.js";

const params = new URLSearchParams(location.search);
const extension = params.get("extension") || "1100";
const password = params.get("password") || "";
const domain = params.get("domain") || "webrtc.test";
const wss = params.get("wss") || "wss://localhost:8089/ws";
const echoExtension = params.get("echo") || "6000";
const iceTransportPolicy = params.get("icePolicy") === "relay" ? "relay" : "all";
let iceServers = [];
try {
  const parsed = JSON.parse(params.get("ice") || "[]");
  if (Array.isArray(parsed)) iceServers = parsed;
} catch {}
const statusEl = document.getElementById("status");
const remoteAudio = document.getElementById("remoteAudio");

const probe = {
  registered: false,
  registrationState: "Initial",
  established: false,
  sessionState: "Initial",
  inboundBytes: 0,
  outboundBytes: 0,
  inboundPackets: 0,
  outboundPackets: 0,
  remoteAudioTracks: 0,
  error: "",
  extension,
  echoExtension,
  wss,
  iceServerCount: iceServers.length,
  iceTransportPolicy
};
window.__webrtcProbe = probe;

function status(message) {
  statusEl.textContent = message;
  console.log("[Magnanimous WebRTC]", message);
}

function fail(error) {
  probe.error = error instanceof Error ? error.message : String(error);
  status("ERROR: " + probe.error);
  console.error(error);
}

async function refreshStats(session) {
  const handler = session.sessionDescriptionHandler;
  const pc = handler && handler.peerConnection;
  if (!pc) return;
  const stats = await pc.getStats();
  let inboundBytes = 0;
  let outboundBytes = 0;
  let inboundPackets = 0;
  let outboundPackets = 0;
  stats.forEach((report) => {
    const kind = report.kind || report.mediaType;
    if (kind !== "audio") return;
    if (report.type === "inbound-rtp" && !report.isRemote) {
      inboundBytes += Number(report.bytesReceived || 0);
      inboundPackets += Number(report.packetsReceived || 0);
    }
    if (report.type === "outbound-rtp" && !report.isRemote) {
      outboundBytes += Number(report.bytesSent || 0);
      outboundPackets += Number(report.packetsSent || 0);
    }
  });
  probe.inboundBytes = inboundBytes;
  probe.outboundBytes = outboundBytes;
  probe.inboundPackets = inboundPackets;
  probe.outboundPackets = outboundPackets;
}

function attachRemoteMedia(session) {
  const handler = session.sessionDescriptionHandler;
  const pc = handler && handler.peerConnection;
  if (!pc) return;
  const stream = new MediaStream();
  for (const receiver of pc.getReceivers()) {
    if (receiver.track && receiver.track.kind === "audio") stream.addTrack(receiver.track);
  }
  probe.remoteAudioTracks = stream.getAudioTracks().length;
  remoteAudio.srcObject = stream;
  remoteAudio.play().catch(() => {});
}

function trackSession(session) {
  session.stateChange.addListener((state) => {
    probe.sessionState = String(state);
    if (state === SessionState.Established) {
      probe.established = true;
      attachRemoteMedia(session);
      status("Echo call established");
      const timer = setInterval(() => {
        refreshStats(session).catch(fail);
        if (session.state === SessionState.Terminated) clearInterval(timer);
      }, 200);
    } else if (state === SessionState.Terminated) {
      probe.established = false;
      status("Call terminated");
    }
  });
}

const uri = UserAgent.makeURI(`sip:${extension}@${domain}`);
if (!uri) throw new Error("Unable to create SIP URI");
const userAgent = new UserAgent({
  uri,
  authorizationUsername: extension,
  authorizationPassword: password,
  transportOptions: { server: wss },
  delegate: {},
  sessionDescriptionHandlerFactoryOptions: {
    peerConnectionConfiguration: {
      iceServers,
      iceTransportPolicy
    }
  }
});
const registerer = new Registerer(userAgent);

registerer.stateChange.addListener((state) => {
  probe.registrationState = String(state);
  probe.registered = state === RegistererState.Registered;
  status(probe.registered ? `Registered as ${extension}` : `Registration state: ${String(state)}`);
});

window.startCall = async function startCall() {
  try {
    if (!probe.registered) throw new Error("Browser SIP endpoint is not registered");
    const target = UserAgent.makeURI(`sip:${echoExtension}@${domain}`);
    if (!target) throw new Error("Unable to create echo target URI");
    const inviter = new Inviter(userAgent, target, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false }
      }
    });
    window.__webrtcSession = inviter;
    trackSession(inviter);
    status(`Calling diagnostic echo extension ${echoExtension}`);
    await inviter.invite();
  } catch (error) {
    fail(error);
    throw error;
  }
};

window.endCall = async function endCall() {
  try {
    const session = window.__webrtcSession;
    if (session && session.state === SessionState.Established) await session.bye();
    await registerer.unregister().catch(() => {});
    await userAgent.stop().catch(() => {});
  } catch (error) {
    fail(error);
  }
};

(async () => {
  try {
    if (!password) throw new Error("Missing WebRTC password");
    await userAgent.start();
    await registerer.register();
  } catch (error) {
    fail(error);
  }
})();
