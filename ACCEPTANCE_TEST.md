# Parallel event-ledger acceptance test

Status: `PROPOSED`.

## Required evidence per run

- repository commit SHA;
- Netlify deploy ID;
- UTC start and finish time;
- session ID;
- relevant function request IDs;
- raw canonical events returned to both clients;
- console and function errors;
- final desktop and Quest server sequence.

## Test A: ordered cross-device cycle

1. Create a fresh test session with canonical sequence `0`.
2. Desktop posts `POINT`; expect sequence `1`.
3. Quest fetches; expect sequence `1` and one event.
4. Quest posts `PLACE`; expect sequence `2`.
5. Quest posts `TURN_ADVANCE` to Elara; expect sequence `3`.
6. Desktop fetches; expect all three events, preserved picture reference, and turn `Elara`.
7. Cold reload both clients without query-string assistance; both must converge on sequence `3`.

## Test B: deliberate race

1. Desktop and Quest submit different event IDs within approximately 200 ms.
2. Repeat 20 times.
3. Every accepted event must have a unique contiguous server sequence.
4. No event may disappear silently.
5. A conditional-write loser must retry or return an explicit failure.

## Test C: offline queue

1. Disconnect Quest.
2. Queue one `POINT` proposal in IndexedDB with a stable event ID.
3. Reconnect.
4. Verify the proposal becomes canonical exactly once.
5. Retry the identical proposal and verify the original canonical event is returned without creating a duplicate.
6. Cold reload both clients and verify identical canonical state.

## Pass threshold

- Tests A and C pass three consecutive cold runs.
- Test B completes all 20 races without a lost or duplicated accepted event.
- No manual copying of state between clients.
- Failures are explicit and traceable rather than overwritten.

Passing this threshold supports the claim `REPRODUCIBLE shared-event system`. It does not yet support claims of authenticated model authorship or autonomous council deliberation.

