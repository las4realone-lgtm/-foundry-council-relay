# Foundry control baseline

Status: **FROZEN INTERACTION-CAPABLE BASELINE** as of 2026-08-25 EDT.

## Current application reference

- Current baseline commit: `da7bf10` - `Repair Quest wrist button hit targets`
- Previous authoritative recovery specimen: `b6f734655db4d69a8be9e038368bcdd28aadc58c`
- Race-harness offline-queue commit: `0379200`
- Previous Netlify production deploy ID: `6a8cf1632e63710009953d4e`
- Production VR URL: `https://coruscating-piroshki-cfec09.netlify.app/vr/`
- Public test bridge: `https://foundry-events-bridge.netlify.app/.netlify/functions/events`
- Legacy shared-state endpoint: `/.netlify/functions/state`
- Acceptance evidence commit: `6ca4db9759eea85e0f01fa2834f1e139a83da888`
- Authoritative recovery session: `baseline-102-test`

Git commits remain immutable comparison points. The earlier recovery specimen is preserved rather than overwritten by the interaction patch.

## Authoritative transport and recovery evidence

The authoritative endpoint returned a contiguous session through `serverSequence: 8`.

For Quest events #7 and #8:

- unique event IDs were returned as `ACCEPTED`;
- client Lamport advanced 6 -> 7;
- server sequence advanced 7 -> 8;
- Wi-Fi-off actions were reported as persisting at `PENDING 1`;
- reconnect triggered automatic upload without refresh or manual Sync;
- the queue returned to `PENDING 0`;
- the endpoint returned the canonical payload hash expected by the corrected client.

After race-harness commit `0379200`, the Architect reported a further Quest recovery cycle:

- offline proposal displayed `PENDING 1`;
- reconnect produced `RECOVERED - ACCEPTED`;
- the local queue cleared to `PENDING 0`.

The earlier `payloadHash mismatch` remains part of the defect history. It is not erased by later passes.

## Wrist-ray evidence at `da7bf10`

The interaction patch replaced CanvasTexture UV-coordinate guessing with two enlarged, invisible, double-sided 3D hit targets.

Architect-reported Quest results:

- selecting `POINT 2` reached the POINT handler and returned `POINT NEEDS CLAIM`;
- selecting `PLACE` independently reached its own prerequisite/action path;
- selecting outside both targets returned `AIM AT BUTTON` and then reset normally.

Classification:

- wrist target discrimination: **PASS**;
- deliberate panel miss creates no action: **PASS**;
- full active-claim `POINT 2 -> PLACE` authoritative transaction: **UNVERIFIED**.

## Boundary

This baseline supports:

- append-only server ordering in the tested event path;
- reported Quest offline persistence and automatic reconnect recovery;
- distinct wrist-button targeting and safe miss behavior.

It does not verify:

- durable same-`eventId` collision handling across concurrent writers and cold server invocations;
- authenticated authorship;
- live independent model adapters;
- autonomous model-to-model communication;
- a CRDT implementation;
- the full active-claim wrist transaction.

Avatar responses remain simulated. Cross-model review remains human-routed. The legacy visual Lamport and authoritative server sequence remain separate concepts.

## Freeze rule

During static chamber construction:

- do not alter wrist targeting, controller mappings, locomotion, event semantics, or synchronization in the same commit as visual work;
- do not delete or replace the comparison commits or deployed endpoints;
- keep geometry changes isolated and reversible;
- test VR entry, locomotion, wrist opening, POINT targeting, PLACE targeting, and deliberate miss after every visual batch;
- classify headset observations as Architect-reported unless supported by server evidence.

## Next dependency order

1. Preserve this baseline record.
2. Resume static Council chamber construction: structural pillars/cornice, hearth surround, then the first physical bay.
3. Re-run the small wrist regression after every visual batch.
4. Before live adapters write, verify the active-claim transaction and durable same-event collision behavior.
5. Add live model adapters only after those writer-safety gates close.
