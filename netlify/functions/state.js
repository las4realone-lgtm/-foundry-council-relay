import { getStore } from "@netlify/blobs";

const STORE_NAME = "foundry-council-bridge";
const STATE_KEY = "shared-state-v1";
const MAX_BODY = 512000;
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

const emptyState = () => ({
  version: 1,
  revision: 0,
  relay: null,
  vr: null,
  relayUpdatedAt: null,
  vrUpdatedAt: null,
  updatedAt: null
});

function reply(statusCode, value) {
  return { statusCode, headers, body: JSON.stringify(value) };
}

async function readState(store) {
  const raw = await store.get(STATE_KEY, { consistency: "strong" });
  if (!raw) return emptyState();
  try { return { ...emptyState(), ...JSON.parse(raw) }; }
  catch { return emptyState(); }
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (event.httpMethod === "GET") {
    return reply(200, { ok: true, state: await readState(store) });
  }

  if (event.httpMethod !== "POST") return reply(405, { ok: false, error: "GET or POST only" });
  if ((event.body || "").length > MAX_BODY) return reply(413, { ok: false, error: "Bridge payload too large" });

  let patch;
  try { patch = JSON.parse(event.body || "{}"); }
  catch { return reply(400, { ok: false, error: "Invalid JSON" }); }

  if (patch.relay !== undefined && (patch.relay === null || typeof patch.relay !== "object")) {
    return reply(400, { ok: false, error: "relay must be an object or omitted" });
  }
  if (patch.vr !== undefined && (patch.vr === null || typeof patch.vr !== "object")) {
    return reply(400, { ok: false, error: "vr must be an object or omitted" });
  }
  if (patch.relay === undefined && patch.vr === undefined) {
    return reply(400, { ok: false, error: "Nothing to update" });
  }

  const current = await readState(store);
  const now = new Date().toISOString();
  const next = {
    ...current,
    revision: (Number(current.revision) || 0) + 1,
    updatedAt: now,
    updatedBy: String(patch.source || "browser").slice(0, 32)
  };

  if (patch.relay !== undefined) {
    next.relay = patch.relay;
    next.relayUpdatedAt = now;
  }
  if (patch.vr !== undefined) {
    next.vr = patch.vr;
    next.vrUpdatedAt = now;
  }

  await store.set(STATE_KEY, JSON.stringify(next));
  return reply(200, { ok: true, state: next });
}
