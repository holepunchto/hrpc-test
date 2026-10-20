# Wire format

The bare-rpc wire format - framing, integers, strings, message types, stream flags, the error struct, payload handling and rejecting frames - is defined in [bare-rpc-test's `WIRE.md`](https://github.com/holepunchto/bare-rpc-test/blob/main/WIRE.md). This document adds the one rule hrpc layers on top, and every rule below has a corresponding machine-checkable vector under `fixtures/`. Where this document and `fixtures/` disagree, `fixtures/` wins; file an issue and fix the prose.

## Command identity

`command` carries the handler's **declared id** - the `id` persisted for that handler in the schema. It does not carry the handler's position in the handler list, and the two are not interchangeable.

They coincide only in the common case, which is what makes this worth stating: when handlers are registered in order with no explicit ids, the first handler is assigned id `0` at position `0`, the second id `1` at position `1`, and so on. An implementation that keys dispatch off position rather than id interoperates perfectly under those conditions and its error is invisible.

The two diverge as soon as ids are declared explicitly, or a handler is added out of numeric order. Then keying off position does not merely fail to resolve - it can resolve to the **wrong handler**, decode the payload against that handler's encoding, and dispatch it, with no error raised anywhere. `fixtures/dispatch-sparse` exists to make that failure observable: it declares `hello` with id `1` at position `0`, `ping` with id `0` at position `1`, and `farewell` with id `5` at position `2`, so a frame with `command = 1` resolves to `hello` by id and to `ping` by position, and `command = 5` resolves by id and has no position at all.

Receivers MUST resolve `command` against declared ids. Senders MUST emit the declared id.

## Fixtures

`fixtures/` is the machine-checkable form of every rule in this document: `dispatch/` covers schema-bound command dispatch, and `dispatch-sparse/` covers command identity where declared ids and handler positions disagree (see [Command identity](#command-identity)). Each family's `frames.json` holds the canonical hex bytes and `messages.json` holds the decoded message each frame corresponds to. The loader in `index.js` also serves bare-rpc-test's families, so `families` and `loadFamily` cover both.
