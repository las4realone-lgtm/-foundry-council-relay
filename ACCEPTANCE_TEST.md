# ACCEPTANCE TEST — `baseline-102-test`

Status: **PARTIAL PASS — authoritative offline queue and recovery verified; physical two-client race remains unverified.**

## Trace

| Field | Value |
|---|---|
| Application commit | `b6f734655db4d69a8be9e038368bcdd28aadc58c` |
| Netlify production deploy | `6a8cf1632e63710009953d4e` |
| Session ID | `baseline-102-test` |
| Test date | 2026-08-24 EDT / 2026-08-25 UTC |
| Clients | Quest Browser and Desktop Chrome |
| Authoritative endpoint | `/.netlify/functions/events?sessionId=baseline-102-test` |
| Legacy endpoint | `/.netlify/functions/state` |
| Final authoritative sequence inspected | `serverSequence: 8` |

Request IDs were not captured for this run. Their absence is recorded rather than reconstructed.

## What was tested

### Test A — ordered event API

The returned session contained accepted events with contiguous server sequences 1 through 8. Events 1 and 2 were desktop-originated setup checks. Events 3 and 4 were synthetic race proposals from two desktop test client IDs. Event 5 was reported as Quest-originated and returned by the server as accepted.

**Result:** PARTIAL PASS. Server ordering was demonstrated. A complete cold Desktop–Quest cycle with captured request IDs was not performed three times.

### Test B — physical Desktop–Quest concurrent race

Required test: Desktop and Quest submit different event IDs within approximately 200 ms, repeated 20 times.

**Result:** UNVERIFIED. Events 3 and 4 exercised ordering with two synthetic desktop client IDs; they do not prove a race between two physical devices.

### Test C — Quest offline queue and recovery

The Architect reported the following first-hand Quest observations:

- Wi-Fi OFF: one unique Quest proposal persisted as `PENDING 1`.
- Wi-Fi ON: the proposal uploaded automatically without browser refresh or manual Sync.
- Queue returned to `PENDING 0`.
- The procedure was repeated with unique events #7 and #8.
- Client Lamport advanced 6 → 7.
- An earlier retry with a fixed event ID returned `DUPLICATE`, demonstrating idempotent event-ID handling.

The authoritative endpoint returned:

| Event | Event ID | Client Lamport | Server sequence | Server received (UTC) | Status |
|---|---|---:|---:|---|---|
| #7 | `baseline-102-test-quest-mt7zx1hj-17b1d512` | 6 | 7 | `2026-08-25T01:38:17.946Z` | `ACCEPTED` |
| #8 | `baseline-102-test-quest-mt8003pt-3ca1d40b` | 7 | 8 | `2026-08-25T01:40:40.934Z` | `ACCEPTED` |

Both returned the canonical payload hash:

`sha256:e84170b432f8396d61854be937557c3e4a5740d6bbe97e0a01faca05e5358c63`

**Result:** PASS for the observed recovery runs. The earlier `payloadHash mismatch` was a real failure; the current application commit introduced canonical JSON hashing, after which the server returned events #6–#8 as accepted. Server acceptance is recorded separately from any broader cryptographic-security claim.

## Boundary

This evidence supports:

- an append-only server-ordered event endpoint;
- durable Quest-side offline queuing;
- automatic reconnect and upload;
- canonical payload-hash compatibility between this client and endpoint;
- duplicate event-ID protection.

It does **not** yet support:

- a proven CRDT implementation;
- a completed 20-run physical Desktop–Quest concurrency test;
- authenticated model authorship;
- autonomous model-to-model communication;
- live independent model adapters;
- shared consciousness or equivalent claims.

Avatar responses remain simulated and cross-model review remains human-routed.

The legacy visual Lamport `102` and authoritative `serverSequence: 8` are separate counters. They must not be merged in documentation.

## Remaining acceptance work

1. Perform the physical Desktop–Quest concurrent-write test 20 times.
2. Capture Netlify `x-nf-request-id` values and function logs for a fresh run.
3. Repeat the ordered cold cycle and offline recovery three times.
4. Preserve this application commit and deploy as the control specimen.
5. Modularize without visual or behavioral changes.
6. Repair wrist-ray hit detection and rerun the acceptance tests.
7. Only afterward define and connect the first real model adapter.
