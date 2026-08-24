import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";

const STORE_NAME = "foundry-council-events-v0";
const MAX_BODY = 128000;
const MAX_EVENTS = 1000;
const MAX_RETRIES = 8;
const TYPES = new Set(["POINT", "BIND", "PLACE", "TURN_ADVANCE"]);
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

function reply(statusCode, value) {
  return new Response(JSON.stringify(value), { status: statusCode, headers });
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;
}

function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sessionKey(sessionId) {
  return `session-${createHash("sha256").update(sessionId).digest("hex")}`;
}

function emptySession(sessionId) {
  return { version: 0, sessionId, serverSequence: 0, events: [], updatedAt: null };
}

function validateProposal(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Body must be an object";
  if (!cleanText(value.sessionId, 96)) return "sessionId is required";
  if (!cleanText(value.eventId, 128)) return "eventId is required";
  if (!cleanText(value.clientId, 96)) return "clientId is required";
  if (!TYPES.has(value.type)) return "Unsupported event type";
  if (!Number.isSafeInteger(value.clientLamport) || value.clientLamport < 0) return "clientLamport must be a non-negative integer";
  if (!cleanText(value.createdAt, 64) || Number.isNaN(Date.parse(value.createdAt))) return "createdAt must be an ISO timestamp";
  if (value.payload === undefined || value.payload === null || typeof value.payload !== "object" || Array.isArray(value.payload)) {
    return "payload must be an object";
  }
  const expected = sha256(value.payload);
  if (value.payloadHash !== expected) return `payloadHash mismatch; expected ${expected}`;
  return null;
}

async function readSession(store, sessionId) {
  const result = await store.getWithMetadata(sessionKey(sessionId), {
    type: "json"
  });
  return {
    state: result?.data || emptySession(sessionId),
    etag: result?.etag || null
  };
}

function canonicalEvent(proposal, sequence) {
  return {
    sessionId: cleanText(proposal.sessionId, 96),
    eventId: cleanText(proposal.eventId, 128),
    clientId: cleanText(proposal.clientId, 96),
    type: proposal.type,
    clientLamport: proposal.clientLamport,
    createdAt: proposal.createdAt,
    payloadHash: proposal.payloadHash,
    payload: proposal.payload,
    serverSequence: sequence,
    serverReceivedAt: new Date().toISOString(),
    status: "ACCEPTED"
  };
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response("", { status: 204, headers });
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (request.method === "GET") {
    const sessionId = cleanText(new URL(request.url).searchParams.get("sessionId"), 96);
    if (!sessionId) return reply(400, { ok: false, error: "sessionId is required" });
    const { state } = await readSession(store, sessionId);
    return reply(200, { ok: true, session: state });
  }

  if (request.method !== "POST") return reply(405, { ok: false, error: "GET or POST only" });
  const body = await request.text();
  if (body.length > MAX_BODY) return reply(413, { ok: false, error: "Event payload too large" });

  let proposal;
  try { proposal = JSON.parse(body || "{}"); }
  catch { return reply(400, { ok: false, error: "Invalid JSON" }); }

  const error = validateProposal(proposal);
  if (error) return reply(400, { ok: false, error });

  const sessionId = cleanText(proposal.sessionId, 96);
  const key = sessionKey(sessionId);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const { state, etag } = await readSession(store, sessionId);
    const existing = state.events.find(item => item.eventId === proposal.eventId);
    if (existing) {
      if (existing.payloadHash !== proposal.payloadHash || existing.type !== proposal.type || existing.clientId !== proposal.clientId) {
        return reply(409, { ok: false, error: "EVENT_ID_CONFLICT", event: existing });
      }
      return reply(200, { ok: true, duplicate: true, event: existing, session: state });
    }

    if (state.events.length >= MAX_EVENTS) return reply(409, { ok: false, error: "SESSION_EVENT_LIMIT" });
    const nextSequence = Number(state.serverSequence || 0) + 1;
    const accepted = canonicalEvent(proposal, nextSequence);
    const next = {
      ...state,
      serverSequence: nextSequence,
      events: [...state.events, accepted],
      updatedAt: accepted.serverReceivedAt
    };

    const result = await store.set(key, JSON.stringify(next), etag ? { onlyIfMatch: etag } : { onlyIfNew: true });
    if (result?.modified) return reply(201, { ok: true, duplicate: false, event: accepted, session: next });
  }

  return reply(503, { ok: false, error: "CONCURRENT_WRITE_RETRY_EXHAUSTED" });
}
