# An unrecognized message type is a decode error

## Context

Four implementations decode this wire format, and they do not agree on what to do with a type tag they do not recognize.

| Implementation  | Given `type = 99`            | Verdict |
| --------------- | ---------------------------- | ------- |
| bare-rpc (JS)   | throws `UNKNOWN_MESSAGE`     | strict  |
| librpc (C)      | `default: return rpc_error;` | strict  |
| bare-rpc-swift  | returns `nil`                | lenient |
| bare-rpc-python | returns `None`               | lenient |

`WIRE.md` already says an unrecognized `type` is a decode error, so the two reference implementations - the pair every port was written against - match the spec and the two later ports drifted from it. The divergence surfaced when those ports started running the shared vectors (holepunchto/bare-rpc-swift#22 and the bare-rpc-python conformance suite): the `negative` family's `type = 99` vector passes under either reading, because "rejected" was never defined for it.

The root cause is that `fixtures/negative` holds two different classes of frame and the prose does not name them. `04000000` is _malformed_ - it claims a four byte body and supplies none. `020000006300` is _well-formed but unrecognized_ - its length, type and id all decode cleanly, and only the type is unknown. An implementer reading "decode error" can reasonably conclude that the second case means "skip it".

protomux ignores message types it does not know, which looks like a counter-precedent but is not: protomux multiplexes independently versioned protocols, so an unknown message legitimately belongs to someone else. bare-rpc frames one session between two halves of one application, often the same bundle. There is no third party whose frames a peer is expected to pass over, so leniency buys much less at this layer than it does above it.

## Decision

An unrecognized type is an error in every implementation. The spec keeps its current position and gains the language it was missing; the two lenient ports come back into line.

The alternative - declaring the type space open and requiring decoders to skip unknown frames - was considered and rejected. It would buy the ability to add a message type without a coordinated upgrade, but it means changing the two implementations that are already correct, weakens corruption detection, and serves an extensibility need nobody has expressed. A reserved-range scheme (types 1-3 defined, some range skippable, the rest an error) is the same trade at higher cost and is not worth building before a fourth message type exists.

## Changes

Each repo is its own pull request.

**hrpc-test** - wording only; no fixture changes. `WIRE.md` names the two rejection classes explicitly, malformed and unrecognized, and states that both must be signalled as errors rather than silently skipped. The `reason` strings in `fixtures/negative/frames.json` already draw this distinction; the prose does not. No release is required because the vectors themselves do not move.

**bare-rpc-swift** - `FrameCodec.decode` catches `MessagesError.unknownMessageType` and returns `nil`; that `do`/`catch` goes, so the error propagates. No new plumbing is needed: `RPC.dispatchFrame` already calls `fail(error)` when decoding throws, and its `guard let message else { return }` was the only path that swallowed the case. `WireVectorsTests.rejectsNegativeFrames` currently accepts a throw or a nil and tightens to require the throw.

**bare-rpc-python** - `messages.py` ends its type dispatch with a bare `return None`, the only such return in the function. It raises instead. As in Swift, the receive loop already calls `_fail(exc)` when `decode_frame` raises. `test_negative_frames` currently accepts `None` and tightens to require the exception. `CLAUDE.md` tells callers to treat `None` as "ignore, not error" and needs correcting.

**bare-rpc (JS)** and **librpc (C)** - no change.

## Consequence for consumers

A peer that sends an unrecognized type now destroys the session in Swift and Python instead of being ignored. That is the point of the change, and it is also the one effect a downstream user could be surprised by, so both ports take a version bump with a changelog entry rather than riding along in someone else's release.

## Verification

Every port already runs the `negative` family, so the vectors are the test. Per repo:

- bare-rpc-swift: `swift test` - 150 tests across 13 suites, with `rejectsNegativeFrames` now requiring a throw.
- bare-rpc-python: `pytest` - 74 tests, with `test_negative_frames` now requiring an exception.
- Both: confirm the tightened assertion fails against the unmodified library before the fix, so the test is known to be load bearing.

## Order

1. `WIRE.md` wording, since the spec is what the ports are being held to.
2. bare-rpc-swift and bare-rpc-python, which are independent of each other.
3. A release of each port, carrying the changelog entry.

## Out of scope

The other divergence found by the same vectors: a zero-length payload decodes to an empty buffer in JS and Python and to `nil` in Swift. The two states are byte-identical on the wire - `050000000101000000` is both "no payload" and "empty payload" - and Swift's encoder round-trips them identically, so uniformity would cost a breaking change and buy nothing at the wire level. The proposal there is one sentence in `WIRE.md` recording the latitude, handled separately from this.
