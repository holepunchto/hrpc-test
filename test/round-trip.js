const test = require('brittle')
const fs = require('fs')
const path = require('path')
const { encodeFrame, toHex, decodeFrame } = require('../lib/frame')
const { ENVELOPE } = require('../lib/cases')

const dir = path.join(__dirname, '..', 'fixtures', 'envelope')

test('envelope: generated frames match committed fixtures', function (t) {
  const frames = JSON.parse(fs.readFileSync(path.join(dir, 'frames.json')))
  t.is(frames.length, ENVELOPE.length, 'one frame per case')
  for (let i = 0; i < ENVELOPE.length; i++) {
    t.is(toHex(encodeFrame(ENVELOPE[i].descriptor)), frames[i], ENVELOPE[i].note)
  }
})

test('envelope: every frame decodes without throwing', function (t) {
  const frames = JSON.parse(fs.readFileSync(path.join(dir, 'frames.json')))
  for (let i = 0; i < frames.length; i++) {
    const buf = Buffer.from(frames[i], 'hex')
    const msg = decodeFrame(buf)
    t.ok(msg && typeof msg.type === 'number', ENVELOPE[i].note + ' decodes')
  }
})

test('envelope: zero-length buffer decodes to an empty Buffer, not null', function (t) {
  const frames = JSON.parse(fs.readFileSync(path.join(dir, 'frames.json')))
  const index = ENVELOPE.findIndex((c) => c.note.includes('zero-length buffer'))
  t.ok(index !== -1, 'zero-length buffer case exists')
  const buf = Buffer.from(frames[index], 'hex')
  const { data } = decodeFrame(buf)
  t.ok(Buffer.isBuffer(data), 'zero-length payload decodes to a Buffer, not null')
  t.is(data.length, 0, 'zero-length payload decodes to an empty buffer')
})
