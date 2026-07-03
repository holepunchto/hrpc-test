const fs = require('fs')
const path = require('path')
const c = require('compact-encoding')
const { encodeFrame, toHex } = require('./lib/frame')
const { ENVELOPE, ERROR, BOUNDARY, SEQUENCE } = require('./lib/cases')
const { build } = require('./lib/dispatch-cases')

function serializeDescriptor(d) {
  const out = { ...d }
  // Buffer.isBuffer (not `if (d.data)`) so a zero-length buffer serializes as
  // "" (empty buffer on the wire), distinct from null (no payload field).
  out.data = Buffer.isBuffer(d.data) ? toHex(d.data) : null
  // Normalize so an undefined code (which JSON.stringify would drop) is
  // recorded as the empty string that actually goes on the wire.
  if ('error' in d && d.error) {
    out.error = { message: d.error.message, code: d.error.code ?? '', errno: d.error.errno }
  }
  return out
}

function writeFamily(dir, cases) {
  fs.mkdirSync(dir, { recursive: true })
  const messages = cases.map((c) => ({
    note: c.note,
    descriptor: serializeDescriptor(c.descriptor)
  }))
  const frames = cases.map((c) => toHex(encodeFrame(c.descriptor)))
  fs.writeFileSync(path.join(dir, 'messages.json'), JSON.stringify(messages, null, 2) + '\n')
  fs.writeFileSync(path.join(dir, 'frames.json'), JSON.stringify(frames, null, 2) + '\n')
}

writeFamily(path.join(__dirname, 'fixtures', 'envelope'), ENVELOPE)
console.log('generated envelope fixtures')

writeFamily(path.join(__dirname, 'fixtures', 'error'), ERROR)
console.log('generated error fixtures')

writeFamily(path.join(__dirname, 'fixtures', 'boundary'), BOUNDARY)
console.log('generated boundary fixtures')

const seq = Buffer.concat(SEQUENCE.map(encodeFrame))
fs.mkdirSync(path.join(__dirname, 'fixtures', 'sequence'), { recursive: true })
fs.writeFileSync(
  path.join(__dirname, 'fixtures', 'sequence', 'frames.json'),
  JSON.stringify({ concatenated: toHex(seq), count: SEQUENCE.length }, null, 2) + '\n'
)
console.log('generated sequence fixture')

const d = build()
const dispatch = [
  {
    note: 'hello request',
    descriptor: {
      type: 1,
      id: 1,
      command: d.commands.hello,
      stream: 0,
      data: c.encode(d.helloRequest, { name: 'ada' })
    }
  },
  {
    note: 'hello response',
    descriptor: {
      type: 2,
      id: 1,
      error: null,
      stream: 0,
      data: c.encode(d.helloResponse, { text: 'hi ada' })
    }
  },
  {
    note: 'ping event',
    descriptor: {
      type: 1,
      id: 0,
      command: d.commands.ping,
      stream: 0,
      data: c.encode(d.pingRequest, { seq: 7 })
    }
  }
]
writeFamily(path.join(__dirname, 'fixtures', 'dispatch'), dispatch)
console.log('generated dispatch fixtures')
