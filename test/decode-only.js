const test = require('brittle')
const fs = require('fs')
const path = require('path')
const { decodeFrame, serializeDescriptor } = require('../lib/frame')

const frames = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'decode-only', 'frames.json'))
)

for (const { hex, descriptor, reason } of frames) {
  test('decode-only: ' + reason, function (t) {
    t.alike(serializeDescriptor(decodeFrame(Buffer.from(hex, 'hex'))), descriptor)
  })
}
