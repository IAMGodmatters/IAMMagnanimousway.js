import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";

const webUrl = process.env.WEBRTC_TEST_PAGE || "http://127.0.0.1:4173/";
const wss = process.env.WEBRTC_WSS_URL || "wss://localhost:8089/ws";
const extension = process.env.WEBRTC_EXTENSION || "1100";
const password = process.env.WEBRTC_PASSWORD || "";
const domain = process.env.WEBRTC_DOMAIN || "webrtc.test";
const echoExtension = process.env.WEBRTC_ECHO_EXTENSION || "6000";
const fakeAudio = process.env.FAKE_AUDIO_WAV;
const asteriskContainer = process.env.ASTERISK_CONTAINER || "magnanimous-webrtc-e2e";
const allowInsecureTls = /^(1|true|yes|on)$/i.test(process.env.WEBRTC_ALLOW_INSECURE_TLS || "");
const serverAssertMode = process.env.WEBRTC_SERVER_ASSERT_MODE || "local-docker";
const iceTransportPolicy = process.env.WEBRTC_ICE_TRANSPORT_POLICY === "relay" ? "relay" : "all";
let iceServers = [];
try {
  iceServers = JSON.parse(process.env.WEBRTC_ICE_SERVERS_JSON || "[]");
} catch {
  throw new Error("WEBRTC_ICE_SERVERS_JSON must be valid JSON");
}
if (!Array.isArray(iceServers)) throw new Error("WEBRTC_ICE_SERVERS_JSON must be an array");

if (!password) throw new Error("WEBRTC_PASSWORD is required");
if (!fakeAudio) throw new Error("FAKE_AUDIO_WAV is required");
const signalingUrl = new URL(wss);
if (signalingUrl.protocol !== "wss:") throw new Error("WEBRTC_WSS_URL must use wss://");
if (!allowInsecureTls && ["localhost", "127.0.0.1", "::1"].includes(signalingUrl.hostname)) {
  throw new Error("Strict public WebRTC verification cannot target localhost.");
}
if (!["local-docker", "remote"].includes(serverAssertMode)) {
  throw new Error("WEBRTC_SERVER_ASSERT_MODE must be local-docker or remote");
}

const launchArgs = [
    "--autoplay-policy=no-user-gesture-required",
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    `--use-file-for-fake-audio-capture=${path.resolve(fakeAudio)}`
  ];
if (allowInsecureTls) launchArgs.unshift("--ignore-certificate-errors");

const browser = await chromium.launch({
  headless: true,
  args: launchArgs
});

try {
  const context = await browser.newContext({
    ignoreHTTPSErrors: allowInsecureTls,
    permissions: ["microphone"]
  });
  const page = await context.newPage();
  page.on("console", (message) => console.log(`browser[${message.type()}] ${message.text()}`));
  page.on("pageerror", (error) => console.error("browser[pageerror]", error));

  const url = new URL(webUrl);
  url.searchParams.set("extension", extension);
  url.searchParams.set("password", password);
  url.searchParams.set("domain", domain);
  url.searchParams.set("wss", wss);
  url.searchParams.set("echo", echoExtension);
  url.searchParams.set("ice", JSON.stringify(iceServers));
  url.searchParams.set("icePolicy", iceTransportPolicy);

  await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__webrtcProbe?.registered === true, null, { timeout: 30000 });

  if (serverAssertMode === "local-docker") {
    const contacts = execFileSync(
      "docker",
      ["exec", asteriskContainer, "asterisk", "-rx", "pjsip show contacts"],
      { encoding: "utf8" }
    );
    if (!contacts.includes(extension)) {
      throw new Error(`Asterisk did not report registered WebRTC contact ${extension}:\n${contacts}`);
    }
    console.log("Asterisk server-side contact registration verified.");
  } else {
    console.log("Remote-host mode: SIP REGISTER success verified from Chromium without host-side Docker access.");
  }

  await page.evaluate(() => window.startCall());
  await page.waitForFunction(() => window.__webrtcProbe?.established === true, null, { timeout: 30000 });

  if (serverAssertMode === "local-docker") {
    const channels = execFileSync(
      "docker",
      ["exec", asteriskContainer, "asterisk", "-rx", "core show channels concise"],
      { encoding: "utf8" }
    );
    if (!channels.includes(echoExtension)) {
      throw new Error(`Asterisk did not show the diagnostic echo channel ${echoExtension}:\n${channels}`);
    }
    console.log("Asterisk echo media channel verified.");
  } else {
    console.log("Remote-host mode: established echo session verifies the public Asterisk dial path.");
  }

  await page.waitForFunction(
    () => {
      const p = window.__webrtcProbe;
      return p && p.inboundBytes > 0 && p.outboundBytes > 0 && p.inboundPackets > 0 && p.outboundPackets > 0 && p.remoteAudioTracks > 0;
    },
    null,
    { timeout: 30000 }
  );

  const result = await page.evaluate(() => ({ ...window.__webrtcProbe }));
  if (result.error) throw new Error(result.error);
  console.log("Magnanimous native WebRTC browser proof:", JSON.stringify(result));

  await page.evaluate(() => window.endCall());
  console.log(`PASS: real Chromium SIP registration and bidirectional WebRTC audio through Asterisk Echo() [mode=${serverAssertMode}, insecure_tls=${allowInsecureTls}].`);
} finally {
  await browser.close();
}
