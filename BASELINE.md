# Foundry verified baseline

Status: `OBSERVED` through the Architect's desktop and Quest test on 2026-08-24.

## Frozen reference

- Repository commit: `76bfa09`
- Live application: `https://coruscating-piroshki-cfec09.netlify.app/vr/`
- Existing bridge endpoint: `/.netlify/functions/state`
- Baseline must remain deployable while the parallel event API is developed.

## Observed cycle

1. Desktop and Quest displayed `AUTO-SYNC: ON · DESKTOP ↔ QUEST`.
2. The canonical shared state was seeded at Lamport `101`.
3. A Quest action advanced Lamport `101 → 102`.
4. The second ledger entry persisted after refresh.
5. The bound picture remained visible in VR.
6. The orange council-turn marker moved to Elara.

This demonstrates one successful cross-device state transition. It does not yet demonstrate safe concurrent writes, idempotent reconnection, authenticated authorship, or live model participation.

## Freeze rule

Until the event API passes its acceptance test:

- do not replace or delete `/.netlify/functions/state`;
- do not migrate the VR client to the new endpoint;
- do not treat simulated avatar text as a live model response;
- do not combine event-ledger work with visual scene changes.

