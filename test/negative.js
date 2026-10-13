const test = require('brittle')
const { decodeFrame } = require('../lib/frame')

const frames = require('..').loadNegative()

for (const { hex, reason } of frames) {
  test('negative: rejected - ' + reason, function (t) {
    // t.exception.all (not plain t.exception): the decoder throws native
    // RangeError/TypeError, which brittle's plain t.exception treats as an
    // uncaught programmer error rather than an expected exception.
    t.exception.all(() => decodeFrame(Buffer.from(hex, 'hex')), reason)
  })
}
