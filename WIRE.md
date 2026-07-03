# Wire format

This document is the normative definition of the bare-rpc / hrpc wire protocol. It is checked against the reference implementation in `bare-rpc` (`lib/messages.js` and `lib/constants.js`, version 1.3.3), not against any other documentation, and every rule below has a corresponding machine-checkable vector under `fixtures/`. Where this document and `fixtures/` disagree, `fixtures/` wins; file an issue and fix the prose.

## Framing

Every message is a single frame: a `uint32` length prefix in little-endian byte order, followed by that many bytes of body. The length prefix itself is back-patched during encoding - the encoder reserves 4 bytes, encodes the body (and payload, if any) after it, then writes the actual byte count into the reserved 4 bytes once it is known. The length counts every byte that follows the length prefix (header fields plus payload bytes) and excludes the 4 length-prefix bytes themselves. A decoder reads the 4-byte length first, then must have at least that many bytes available before decoding the body; if fewer bytes are available it throws (`fixtures/negative` includes a truncated-frame vector: a length of 4 with zero following bytes).

## Integers

Every integer other than the leading `uint32` frame length is a compact varint (`compact-encoding`'s `uint`/`int`). A varint is a one-byte tag followed by zero or more value bytes:

| First byte    | Meaning                              |
| ------------- | ------------------------------------ |
| `0x00`-`0xfc` | the value itself, one byte total     |
| `0xfd`        | followed by a little-endian `uint16` |
| `0xfe`        | followed by a little-endian `uint32` |
| `0xff`        | followed by a little-endian `uint64` |

Signed integers (the error struct's `errno`) use zigzag coding on top of the same varint: encode `n` as `2n` for `n >= 0` and `-2n - 1` for `n < 0`, then varint-encode the result, so small magnitudes in either direction stay short.

Encoders MUST emit the minimal-width tag for a given value (e.g. a value of `1` MUST be encoded as the single byte `01`, never as `fd0100`). This is what makes the byte sequences in `fixtures/` canonical: there is exactly one correct encoding for every message in the fixture set, and an implementation's encoder is only conformant if it reproduces those bytes exactly. Decoders, however, are lenient about width: the reference decoder trusts the tag byte and reads that many value bytes without checking whether a narrower tag could have represented the same value. For example decoding `fd0100` (tag `0xfd`, meaning "read a `uint16`") yields `1` without error, even though `1` should have been encoded as a single byte. Do not rely on a decoder rejecting overlong varints - conformant decoders are not required to, and the reference implementation does not. `fixtures/boundary` exercises the tag-width thresholds (values around `0xfc`, `0xffff`) but does not include an overlong-varint reject case, because the reference decoder accepts it.

## Message types

The frame body opens with two varints common to every message: `type` and `id`. `type` selects one of three message shapes; the remaining fields depend on it.

```
type: REQUEST = 1
type: RESPONSE = 2
type: STREAM = 3
```

An unrecognized `type` value is a decode error (`fixtures/negative` includes a vector with `type = 99`).

### REQUEST (`type = 1`)

Field order: `type, id, command, stream, [dataLen, data]`.

`command` and `stream` are varints. `dataLen` and `data` are present only when `stream === 0`; `dataLen` is a varint byte count and `data` is that many raw payload bytes.

### RESPONSE (`type = 2`)

Field order: `type, id, hasError, stream, [error | dataLen, data]`.

`hasError` is a single boolean byte (`0x00` or `0x01`). If `hasError` is true, the error struct (below) follows and there is no payload. If `hasError` is false and `stream === 0`, `dataLen`/`data` follow as in REQUEST. If `hasError` is false and `stream !== 0`, no further fields follow.

### STREAM (`type = 3`)

Field order: `type, id, stream, [error | dataLen, data]`.

`stream` is a varint whose bits select the message's role (see "Stream flags" below). If `stream & ERROR` is set, the error struct follows. Otherwise if `stream & DATA` is set, `dataLen`/`data` follow. Otherwise no further fields follow.

## Stream flags

`stream` is a bitmask. The low byte names the stream action; bit `0x100` and bit `0x200` mark which side (requester or responder) the frame flows from. The two bit groups are combined by OR:

| Bit     | Name     | Meaning                               |
| ------- | -------- | ------------------------------------- |
| `0x1`   | OPEN     | open a stream                         |
| `0x2`   | CLOSE    | close a stream                        |
| `0x4`   | PAUSE    | pause a stream                        |
| `0x8`   | RESUME   | resume a stream                       |
| `0x10`  | DATA     | this frame carries payload data       |
| `0x20`  | END      | end of stream                         |
| `0x40`  | DESTROY  | destroy a stream                      |
| `0x80`  | ERROR    | this frame carries an error struct    |
| `0x100` | REQUEST  | frame flows in the request direction  |
| `0x200` | RESPONSE | frame flows in the response direction |

There are two distinct encodings for "open a stream," and they are not interchangeable:

- **Stream-open** (the very first frame that establishes a stream) is a REQUEST or RESPONSE message (`type = 1` or `type = 2`) whose `stream` field is exactly `0x1` (`OPEN`), with no direction bit and no other action bit set.
- **Every other stream control or data frame** (close, pause, resume, data, end, destroy, error, and any subsequent traffic on that stream) is a STREAM message (`type = 3`) whose `stream` field OR's a direction bit (`0x100` for a frame flowing in the request direction, `0x200` for the response direction) with one or more action bits. For example a response-side data frame is `RESPONSE | DATA = 0x200 | 0x10 = 0x210`, and a request-side close-with-error is `REQUEST | CLOSE | ERROR = 0x100 | 0x2 | 0x80 = 0x182`.

`fixtures/error` includes stream-close-with-error and stream-destroy-with-error vectors in both directions; `fixtures/sequence` exercises a full open/data/data/end sequence.

## Error struct

When a frame carries an error (RESPONSE with `hasError`, or STREAM with the `ERROR` bit set), the struct is three fields in this order:

```
message: utf8
code: utf8
errno: int (signed zigzag varint)
```

The canonical field name is `errno`, not `status`. `code` is always a string on the wire: if the source value is `null` or `undefined`, it encodes as the empty string, not as an omitted field or a literal `"null"`/`"undefined"`. `fixtures/error` includes both a null-code and an undefined-code case, each expected to decode back to an empty string; this is a regression fixture for a coercion bug where the field was previously stringified through `String(code)`, which produces the text `"null"`/`"undefined"` for those inputs instead of the empty string.

## Payload handling

`dataLen` is a trailing varint (`uint`) in the header, immediately followed by that many raw payload bytes; there is no length prefix on the payload bytes themselves beyond `dataLen`. Whether a frame has a payload at all depends on `stream`, as described above:

- A frame with `stream === 0` (REQUEST, or RESPONSE without an error) always decodes `data` as a `Buffer`, including when `dataLen` is `0` - the result is an empty buffer, not `null`. `fixtures/envelope` includes a zero-length-payload vector asserting the decoded value is a zero-length `Buffer`.
- A frame with `stream !== 0` and no `DATA`/`ERROR` bit (bare stream control frames such as open, close, pause, resume, end, destroy) decodes `data` as `null` - there is no `dataLen` field on the wire for these frames at all.

## Fixtures

`fixtures/` is the machine-checkable form of every rule in this document: `envelope/` covers the three message types and payload/null semantics, `error/` covers the error struct and the null/undefined-code regression, `boundary/` covers varint tag-width thresholds, `negative/` covers malformed input a decoder must reject, `sequence/` covers a multi-frame stream concatenated into one buffer, and `dispatch/` covers schema-bound command dispatch. Each family's `frames.json` holds the canonical hex bytes and `messages.json` (or the family's own structure) holds the decoded message each frame corresponds to. An implementation is wire-conformant if it can decode every fixture frame into the described message and re-encode every described message into the exact fixture frame.
