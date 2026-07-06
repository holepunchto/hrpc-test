const path = require('path')
const fs = require('fs')
const Hyperschema = require('hyperschema')
const HRPC = require('hrpc')

const SCHEMA_DIR = path.join(__dirname, '..', 'fixtures', 'dispatch', 'schema')
const HRPC_DIR = path.join(__dirname, '..', 'fixtures', 'dispatch', 'hrpc')

function build() {
  // 1) Types (written to SCHEMA_DIR)
  const schema = Hyperschema.from(SCHEMA_DIR)
  const ns = schema.namespace('greeter')
  ns.register({ name: 'hello-request', fields: [{ name: 'name', type: 'string', required: true }] })
  ns.register({
    name: 'hello-response',
    fields: [{ name: 'text', type: 'string', required: true }]
  })
  ns.register({ name: 'ping-request', fields: [{ name: 'seq', type: 'uint', required: true }] })
  Hyperschema.toDisk(schema)

  // 2) RPC handlers (written to HRPC_DIR). Ids are assigned by registration
  // order and persisted to hrpc.json - do not hardcode them.
  const hrpc = HRPC.from(SCHEMA_DIR, HRPC_DIR)
  const rns = hrpc.namespace('greeter')
  rns.register({
    name: 'hello',
    request: { name: '@greeter/hello-request', stream: false },
    response: { name: '@greeter/hello-response', stream: false }
  })
  rns.register({
    name: 'ping',
    request: { name: '@greeter/ping-request', stream: false, send: true },
    response: null
  })
  HRPC.toDisk(hrpc, HRPC_DIR) // two args per builder.cjs:174 (one-arg works via hrpc.hrpcDir fallback, but be explicit)

  // 3) Read frozen ids back from the generated hrpc.json
  const hrpcJson = JSON.parse(fs.readFileSync(path.join(HRPC_DIR, 'hrpc.json'), 'utf8'))
  const commands = {}
  for (const h of hrpcJson.schema) commands[h.name.split('/')[1]] = h.id

  const codecs = require(path.join(SCHEMA_DIR, 'index.js'))
  return {
    helloRequest: codecs.getEncoding('@greeter/hello-request'),
    helloResponse: codecs.getEncoding('@greeter/hello-response'),
    pingRequest: codecs.getEncoding('@greeter/ping-request'),
    commands // e.g. { hello: 0, ping: 1 } - derived, not asserted
  }
}

module.exports = { build, SCHEMA_DIR, HRPC_DIR }
