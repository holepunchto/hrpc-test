const path = require('path')
const fs = require('fs')
const Hyperschema = require('hyperschema')
const HRPC = require('hrpc')

const SCHEMA_DIR = path.join(__dirname, '..', 'fixtures', 'dispatch-sparse', 'schema')
const HRPC_DIR = path.join(__dirname, '..', 'fixtures', 'dispatch-sparse', 'hrpc')

// Ids here are declared explicitly and deliberately do not match registration
// order, because the contiguous case cannot discriminate. When ids are 0, 1, 2
// assigned in registration order, keying dispatch by the declared id and keying
// it by position in the handler array give identical results, so an
// implementation that uses the wrong one still interoperates and still passes.
//
// These ids separate the two:
//
//   name      declared id   position
//   hello     1             0
//   ping      0             1
//   farewell  5             2
//
// A frame carrying command=1 is hello by id and ping by position - a silent
// misdispatch to the wrong handler with a decodable payload, not an error.
// command=0 is the same mistake in reverse. command=5 resolves by id and has no
// position at all, so it fails outright. The wire identifier is the declared
// id; position is an implementation detail that must not reach the wire.
function build() {
  const schema = Hyperschema.from(SCHEMA_DIR)
  const ns = schema.namespace('sparse')
  ns.register({ name: 'hello-request', fields: [{ name: 'name', type: 'string', required: true }] })
  ns.register({
    name: 'hello-response',
    fields: [{ name: 'text', type: 'string', required: true }]
  })
  ns.register({ name: 'ping-request', fields: [{ name: 'seq', type: 'uint', required: true }] })
  Hyperschema.toDisk(schema)

  const hrpc = HRPC.from(SCHEMA_DIR, HRPC_DIR)
  const rns = hrpc.namespace('sparse')
  rns.register({
    name: 'hello',
    id: 1,
    request: { name: '@sparse/hello-request', stream: false },
    response: { name: '@sparse/hello-response', stream: false }
  })
  rns.register({
    name: 'ping',
    id: 0,
    request: { name: '@sparse/ping-request', stream: false, send: true },
    response: null
  })
  rns.register({
    name: 'farewell',
    id: 5,
    request: { name: '@sparse/hello-request', stream: false },
    response: { name: '@sparse/hello-response', stream: false }
  })
  HRPC.toDisk(hrpc, HRPC_DIR)

  // Read the ids back rather than restating them, so the fixture stays true to
  // whatever was persisted.
  const hrpcJson = JSON.parse(fs.readFileSync(path.join(HRPC_DIR, 'hrpc.json'), 'utf8'))
  const commands = {}
  const positions = {}
  hrpcJson.schema.forEach((h, i) => {
    const name = h.name.split('/')[1]
    commands[name] = h.id
    positions[name] = i
  })

  const codecs = require(path.join(SCHEMA_DIR, 'index.js'))
  return {
    helloRequest: codecs.getEncoding('@sparse/hello-request'),
    helloResponse: codecs.getEncoding('@sparse/hello-response'),
    pingRequest: codecs.getEncoding('@sparse/ping-request'),
    commands,
    positions
  }
}

module.exports = { build, SCHEMA_DIR, HRPC_DIR }
