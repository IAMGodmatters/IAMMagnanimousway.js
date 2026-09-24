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

if (!password) throw new Error("WEBRTC_PASSWORD is required");
if (!fakeAudio) throw new Error("FAKE_AUDIO_WAV is required");

const browser = await chromium.launch({
  headless: true,
  args: [
    "--ignore-certificate-errors",
    "--autoplay-policy=no-user-gesture-required",
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    `--use-file-for-fake-audio-capture=${path.resolve(fakeAudio)}`
  ]
});

try {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
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

  await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__webrtcProbe?.registered === true, null, { timeout: 30000 });

  const contacts = execFileSync(
    "docker",
    ["exec", asteriskContainer, "asterisk", "-rx", "pjsip show contacts"],
    { encoding: "utf8" }
  );
  if (!contacts.includes(extension)) {
    throw new Error(`Asterisk did not report registered WebRTC contact ${extension}:\n${contacts}`);
  }
  console.log("Asterisk server-side contact registration verified.");

  await page.evaluate(() => window.startCall());
  await page.waitForFunction(() => window.__webrtcProbe?.established === true, null, { timeout: 30000 });

  const channels = execFileSync(
    "docker",
    ["exec", asteriskContainer, "asterisk", "-rx", "core show channels concise"],
    { encoding: "utf8" }
  );
  if (!channels.includes(echoExtension)) {
    throw new Error(`Asterisk did not show the diagnostic echo channel ${echoExtension}:\n${channels}`);
  }
  console.log("Asterisk echo media channel verified.");

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
  console.log("PASS: real Chromium SIP registration and bidirectional WebRTC audio through Asterisk Echo().");
} finally {
  await browser.close();
}
