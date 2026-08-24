const fs = require('fs')
const path = require('path')
const c = require('compact-encoding')
const { encodeFrame, toHex, decodeFrame, serializeDescriptor } = require('./lib/frame')
const { ENVELOPE, ERROR, BOUNDARY, SEQUENCE } = require('./lib/cases')
const { build } = require('./lib/dispatch-cases')
const { build: buildSparse } = require('./lib/dispatch-sparse-cases')

function writeFamily(dir, cases) {
  fs.mkdirSync(dir, { recursive: true })
  const frames = cases.map((c) => encodeFrame(c.descriptor))
  // messages.json describes what each frame decodes to, not the input
  // descriptor: a stream=0 null payload goes on the wire as dataLen=0 and
  // decodes to an empty buffer, never null. Deriving from the decoded frame
  // keeps the description honest about wire reality for every case.
  const messages = frames.map((frame, i) => ({
    note: cases[i].note,
    descriptor: serializeDescriptor(decodeFrame(frame))
  }))
  fs.writeFileSync(path.join(dir, 'messages.json'), JSON.stringify(messages, null, 2) + '\n')
  fs.writeFileSync(path.join(dir, 'frames.json'), JSON.stringify(frames.map(toHex), null, 2) + '\n')
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

// Sparse ids: every command below carries its declared id, which is what the
// wire identifier is. See lib/dispatch-sparse-cases.js for why these ids and
// what an implementation keying off handler position gets wrong instead.
const s = buildSparse()
const sparse = [
  {
    note: 'hello request, id 1 at position 0 - resolves to ping if keyed by position',
    descriptor: {
      type: 1,
      id: 1,
      command: s.commands.hello,
      stream: 0,
      data: c.encode(s.helloRequest, { name: 'ada' })
    }
  },
  {
    note: 'ping event, id 0 at position 1 - resolves to hello if keyed by position',
    descriptor: {
      type: 1,
      id: 0,
      command: s.commands.ping,
      stream: 0,
      data: c.encode(s.pingRequest, { seq: 7 })
    }
  },
  {
    note: 'farewell request, id 5 at position 2 - no position 5 exists, so keying by position fails outright',
    descriptor: {
      type: 1,
      id: 2,
      command: s.commands.farewell,
      stream: 0,
      data: c.encode(s.helloRequest, { name: 'ada' })
    }
  },
  {
    note: 'farewell response',
    descriptor: {
      type: 2,
      id: 2,
      error: null,
      stream: 0,
      data: c.encode(s.helloResponse, { text: 'bye ada' })
    }
  }
]
writeFamily(path.join(__dirname, 'fixtures', 'dispatch-sparse'), sparse)
console.log('generated dispatch-sparse fixtures')
