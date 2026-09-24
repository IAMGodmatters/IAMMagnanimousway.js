import dns from "node:dns/promises";
import net from "node:net";

const raw = process.env.WEBRTC_WSS_URL || process.argv[2] || "";
if (!raw) throw new Error("WEBRTC_WSS_URL is required");
const url = new URL(raw);
if (url.protocol !== "wss:") throw new Error("Public verification requires wss://");
if (url.username || url.password) throw new Error("Do not embed credentials in WEBRTC_WSS_URL");

const host = url.hostname;
const normalized = host.replace(/^\[|\]$/g, "");
const forbiddenNames = new Set(["localhost", "localhost.localdomain"]);
if (forbiddenNames.has(normalized.toLowerCase()) || normalized.endsWith(".local")) {
  throw new Error("Public verification cannot target a local hostname");
}

function isPrivate(address) {
  if (net.isIPv4(address)) {
    const parts = address.split(".").map(Number);
    return parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127);
  }
  if (net.isIPv6(address)) {
    const lower = address.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:");
  }
  return true;
}

const records = await dns.lookup(normalized, { all: true });
if (!records.length) throw new Error("Public WSS hostname did not resolve");
const blocked = records.filter((item) => isPrivate(item.address));
if (blocked.length) {
  throw new Error(`Public verification hostname resolves to non-public address(es): ${blocked.map(x => x.address).join(", ")}`);
}

const port = url.port || "443";
console.log(JSON.stringify({ host: normalized, port, addresses: records.map(x => x.address) }));
