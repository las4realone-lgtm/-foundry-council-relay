# Foundry event contract v0

Status: `PROPOSED`. This contract runs beside the verified state bridge until acceptance testing succeeds.

## Design boundary

The server is authoritative for event ordering. Clients may propose events and retain unsent proposals while offline, but they may not overwrite the canonical event log or assign the final server sequence.

## Event proposal

```json
{
  "sessionId": "baseline-102-test",
  "eventId": "quest-01:000001",
  "clientId": "quest-01",
  "type": "PLACE",
  "clientLamport": 102,
  "createdAt": "2026-08-24T18:33:11.000Z",
  "payloadHash": "sha256:...",
  "payload": {}
}
```

Required fields:

- `sessionId`: server-validated test or council-session namespace.
- `eventId`: stable idempotency key generated once and preserved across retries.
- `clientId`: installation identifier; it is not proof of human or model identity.
- `type`: one of the allow-listed event types.
- `clientLamport`: the client's causal observation when proposing the event.
- `createdAt`: client-reported timestamp retained as reported data.
- `payloadHash`: SHA-256 of the canonical payload representation; integrity only, not authorship.
- `payload`: event-specific data.

## Canonical event

The server adds:

```json
{
  "serverSequence": 103,
  "serverReceivedAt": "2026-08-24T18:33:11.120Z",
  "status": "ACCEPTED"
}
```

`serverSequence` is the canonical total order within a session. Lamport values remain useful for causal evidence, but they are not used as a unique database key.

## Event types

- `POINT`
- `BIND`
- `PLACE`
- `TURN_ADVANCE`

Compound user actions should use one explicit transaction envelope or separate events with separate server sequences. They must never silently share one sequence number.

## Idempotency

- Reposting the same `sessionId + eventId` with the same payload returns the original canonical event.
- Reposting that key with a different payload returns `409 EVENT_ID_CONFLICT`.
- A reconnecting client keeps queued events until each receives an explicit canonical result.
- Clients never discard unsent offline events merely because the server is ahead.

## Concurrency

The first prototype may use Netlify Blobs only with:

- strong reads;
- an ETag read of the current session head;
- an atomic conditional write using `onlyIfMatch`;
- bounded retry after a failed conditional write;
- explicit `409` or `503` after retry exhaustion;
- no silent last-write-wins behavior.

If this cannot pass the race test reliably, migrate the event authority to a transactional database before connecting live model adapters.

## Reconnection

1. Fetch the canonical server head and events after the client's last acknowledged sequence.
2. Fast-forward the rendered local view.
3. Submit queued proposals in original local order using their stable event IDs.
4. Record the server's acceptance, duplicate acknowledgement, or rejection for every proposal.
5. Fetch once more and verify convergence.

## Provenance classifications

- `OBSERVED`: instrumented first-hand result.
- `REPORTED`: a person or client reports a result without the required instrumentation.
- `REPRODUCIBLE`: the same observed result passes the defined independent rerun threshold.
- `INFERRED`: conclusion drawn from observed or reported evidence.
- `PROPOSED`: unimplemented design or next action.
- `UNVERIFIED`: claim awaiting evidence.
- `METAPHOR`: interpretive language with no evidentiary weight.

## Security boundary

Payload hashing does not establish authorship. A later authenticated adapter or signature layer is required before the ledger can claim which human or model produced an event.

