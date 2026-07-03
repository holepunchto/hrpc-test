const fs = require('fs')
const path = require('path')
const c = require('compact-encoding') // used by the dispatch family in Task 7
const { encodeFrame, toHex } = require('./lib/frame')
const { ENVELOPE } = require('./lib/cases')

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
