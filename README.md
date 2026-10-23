# hrpc-test

Cross-language conformance vectors for hrpc command dispatch, on top of the bare-rpc wire vectors from [bare-rpc-test](https://github.com/holepunchto/bare-rpc-test).

`WIRE.md` defines command identity, the rule hrpc adds to the bare-rpc wire format, which bare-rpc-test's `WIRE.md` defines. `fixtures/` holds the `dispatch` and `dispatch-sparse` vectors, generated from the reference `bare-rpc` and `hrpc` implementations. The loader re-exports bare-rpc-test's families alongside them, so implementations verify wire compatibility the same way for both: decode each fixture's frame hex and assert it matches the described message, then re-encode the message and assert it matches the frame hex.

Regenerate fixtures with `npm run generate`.
