# Changelog

## 0.3.0

The bare-rpc wire vectors and wire format moved to `bare-rpc-test`. This package keeps the hrpc dispatch vectors and re-exports the rest, so its loaders return what they did.

- `families`, `loadFamily`, `loadNegative`, `loadDecodeOnly` and `loadSequence` serve the `envelope`, `error`, `boundary`, `negative`, `decode-only` and `sequence` vectors from `bare-rpc-test` 0.1.0, next to `dispatch` and `dispatch-sparse` (#38).
- Breaking: `fixturesDir` holds only `dispatch` and `dispatch-sparse`. A consumer that reads the moved families by path reads them from `bare-rpc-test`.
- `WIRE.md` keeps command identity and points to `bare-rpc-test`'s `WIRE.md` for the wire format.
- Breaking: the Python package is removed. Every language reads the npm package (#36).

## 0.2.4

- `WIRE.md` defines how a string is encoded, a byte count then UTF-8 (#23), and ships in the package (#25).
- `decode-only` vectors and `loadDecodeOnly`: frames whose length covers bytes beyond the last field, which a decoder ignores, one for each message type (#29, #30).

## 0.2.3

- `negative` vectors for a body whose fields run past the end of the frame (#20).

## 0.2.2

- The Python loader exports `dispatch-sparse` as well; both loaders read the family list from `fixtures/families.json` (#17).

## 0.2.1

- `dispatch-sparse` is exported as a family (#15).

## 0.2.0

- `dispatch-sparse`, a dispatch fixture whose declared ids and handler positions disagree, so dispatch keyed by position fails it (#13).
- `WIRE.md` states what rejecting a frame requires: a malformed frame and an unrecognized type both signal an error rather than being skipped (#12).

## 0.1.0

Leaves 0.0.x, so a `^0.1.0` range picks up later releases. The fixtures and loaders are the same as 0.0.4.

## 0.0.4

- A `uint64` boundary vector, for the `0xff` varint tag (#6).
- `messages.json` describes the decoded frame rather than the input, so a zero-length payload reads as an empty buffer (#5).
- Installable from Python as `hrpc_test` (#7).

## 0.0.3

- Loads under Bare, through a `bare-fs` and `bare-path` imports map (#3).

## 0.0.2

Initial release: `WIRE.md`, the normative bare-rpc and hrpc wire format, canonical byte vectors for it, and a JavaScript loader (#1).
