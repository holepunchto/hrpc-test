const test = require('brittle')
const { decodeFrame, serializeDescriptor } = require('../lib/frame')

const frames = require('..').loadDecodeOnly()

for (const { hex, descriptor, reason } of frames) {
  test('decode-only: ' + reason, function (t) {
    t.alike(serializeDescriptor(decodeFrame(Buffer.from(hex, 'hex'))), descriptor)
  })
}
