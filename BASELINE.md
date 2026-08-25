# Foundry control baseline

Status: **FROZEN CONTROL SPECIMEN** for the observed authoritative offline-queue recovery on 2026-08-24 EDT / 2026-08-25 UTC.

## Frozen application reference

- Application commit: `b6f734655db4d69a8be9e038368bcdd28aadc58c`
- Netlify production deploy ID: `6a8cf1632e63710009953d4e`
- Production URL: `https://coruscating-piroshki-cfec09.netlify.app/vr/`
- Authoritative event endpoint: `/.netlify/functions/events`
- Legacy shared-state endpoint: `/.netlify/functions/state`
- Acceptance evidence commit: `6ca4db9759eea85e0f01fa2834f1e139a83da888`
- Test session: `baseline-102-test`

The application commit and deployment above are the behavioral control specimen. Later documentation-only commits do not redefine the tested application.

## Observed evidence

The authoritative endpoint returned a contiguous session through `serverSequence: 8`.

For Quest events #7 and #8:

- unique event IDs were returned as `ACCEPTED`;
- client Lamport advanced 6 → 7;
- server sequence advanced 7 → 8;
- Wi-Fi-off actions were reported as persisting at `PENDING 1`;
- reconnect triggered automatic upload without refresh or manual Sync;
- the queue returned to `PENDING 0`;
- the endpoint returned the canonical payload hash expected by the corrected client.

The earlier `payloadHash mismatch` remains part of the defect history. It is not erased by the later pass.

Full evidence and limitations are recorded in `ACCEPTANCE_TEST.md`.

## Boundary

This baseline verifies an append-only server-ordered event path and observed Quest offline recovery. It does not verify:

- a CRDT implementation;
- the required 20-run physical Desktop–Quest concurrent race;
- authenticated model authorship;
- autonomous model-to-model communication;
- live independent model adapters.

Avatar responses remain simulated. Cross-model review remains human-routed.

The legacy visual Lamport `102` is not the authoritative `serverSequence: 8`.

## Freeze rule

Until modularization reproduces the baseline behavior:

- do not delete or replace either deployed endpoint;
- do not combine refactoring with visual changes;
- do not change event semantics while moving code;
- keep the frozen commit and deploy available as the comparison specimen;
- treat any claim beyond `ACCEPTANCE_TEST.md` as unverified.

## Next dependency order

1. Complete the physical Desktop–Quest concurrent-write test.
2. Capture request IDs and function logs on a fresh run.
3. Modularize scene, interaction, synchronization, and ledger without visual or behavioral changes.
4. Repair wrist-ray hit detection and rerun acceptance tests.
5. Only afterward define and connect the first real model adapter.
