const test = require('brittle')
const fs = require('fs')
const path = require('path')
const c = require('compact-encoding')
const { encodeFrame, toHex, decodeFrame } = require('../lib/frame')
const { ENVELOPE, ERROR, BOUNDARY } = require('../lib/cases')

const dir = path.join(__dirname, '..', 'fixtures', 'envelope')
const errDir = path.join(__dirname, '..', 'fixtures', 'error')

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

test('error: frames match and codes decode as expected', function (t) {
  const frames = JSON.parse(fs.readFileSync(path.join(errDir, 'frames.json')))
  for (let i = 0; i < ERROR.length; i++) {
    const cse = ERROR[i]
    t.is(toHex(encodeFrame(cse.descriptor)), frames[i], cse.note + ' frame')
    const msg = decodeFrame(Buffer.from(frames[i], 'hex'))
    if ('expectCode' in cse) t.is(msg.error.code, cse.expectCode, cse.note + ' code')
  }
})

const bDir = path.join(__dirname, '..', 'fixtures', 'boundary')
test('boundary: frames match and re-decode', function (t) {
  const frames = JSON.parse(fs.readFileSync(path.join(bDir, 'frames.json')))
  for (let i = 0; i < BOUNDARY.length; i++) {
    t.is(toHex(encodeFrame(BOUNDARY[i].descriptor)), frames[i], BOUNDARY[i].note)
    const msg = decodeFrame(Buffer.from(frames[i], 'hex'))
    t.is(msg.id, BOUNDARY[i].descriptor.id, BOUNDARY[i].note + ' id')
    t.is(msg.command, BOUNDARY[i].descriptor.command, BOUNDARY[i].note + ' command')
    t.is(
      msg.data ? msg.data.length : 0,
      BOUNDARY[i].descriptor.data ? BOUNDARY[i].descriptor.data.length : 0,
      BOUNDARY[i].note + ' data length'
    )
  }
})

const seqDir = path.join(__dirname, '..', 'fixtures', 'sequence')
test('sequence: concatenated frames re-split by length prefix', function (t) {
  const { concatenated, count } = JSON.parse(fs.readFileSync(path.join(seqDir, 'frames.json')))
  const buf = Buffer.from(concatenated, 'hex')
  const state = c.state(0, buf.length, buf)
  let seen = 0
  const m = require('bare-rpc/messages')
  while (state.start < state.end) {
    const msg = m.message.decode(state)
    t.ok(msg, 'frame ' + seen)
    seen++
  }
  t.is(seen, count, 'all frames re-split')
})
