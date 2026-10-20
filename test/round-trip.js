const test = require('brittle')
const c = require('compact-encoding')
const { decodeFrame, serializeDescriptor } = require('../lib/frame')
const { build } = require('../lib/dispatch-cases')
const { families, loadFamily } = require('..')

// The cross-language contract is the (frames.json, messages.json) pair: a
// foreign implementation reads messages.json as the description of the bytes in
// frames.json. Assert every committed frame decodes back to exactly its
// committed description - this validates the decode direction and that the two
// files agree. serializeDescriptor is the same projection generate.js uses, so
// a decoded message maps into the identical JSON shape messages.json stores.
test('messages.json describes frames.json (decode round-trips)', function (t) {
  for (const family of families) {
    const { frames, messages } = loadFamily(family)
    t.is(frames.length, messages.length, family + ': one frame per message')
    for (let i = 0; i < frames.length; i++) {
      const decoded = serializeDescriptor(decodeFrame(Buffer.from(frames[i], 'hex')))
      t.alike(decoded, messages[i].descriptor, family + ': ' + messages[i].note)
    }
  }
})

test('dispatch: frames carry schema-derived command ids and payloads round-trip', function (t) {
  const d = build()
  const { frames, messages } = loadFamily('dispatch')
  t.is(frames.length, messages.length, 'one frame per message')

  const helloRequest = decodeFrame(Buffer.from(frames[0], 'hex'))
  t.is(helloRequest.command, d.commands.hello, 'hello request command id')
  t.alike(c.decode(d.helloRequest, helloRequest.data), { name: 'ada' }, 'hello request payload')

  const helloResponse = decodeFrame(Buffer.from(frames[1], 'hex'))
  t.alike(
    c.decode(d.helloResponse, helloResponse.data),
    { text: 'hi ada' },
    'hello response payload'
  )

  const pingEvent = decodeFrame(Buffer.from(frames[2], 'hex'))
  t.is(pingEvent.id, 0, 'ping is an event (id 0)')
  t.is(pingEvent.command, d.commands.ping, 'ping event command id')
  t.alike(c.decode(d.pingRequest, pingEvent.data), { seq: 7 }, 'ping event payload')
})
