# hrpc-test

Cross-language wire-conformance vectors and the normative spec for the bare-rpc / hrpc wire protocol.

`WIRE.md` is the normative wire-format definition. `fixtures/` holds canonical byte vectors generated from the reference `bare-rpc` implementation. Other implementations verify wire compatibility by decoding each fixture's frame hex and asserting it matches the described message, and by re-encoding the message and asserting it matches the frame hex.

Regenerate fixtures with `npm run generate`.
