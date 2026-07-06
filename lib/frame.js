const c = require('compact-encoding')
const m = require('bare-rpc/messages')

// Encode one message descriptor to a full wire frame (header bytes + payload
// bytes). c.encode(m.header, ...) sizes the frame length to include the
// payload but does not write the payload itself, so concat it here.
function encodeFrame(descriptor) {
  const header = c.encode(m.header, descriptor)
  if (descriptor.data) return Buffer.concat([header, descriptor.data])
  return Buffer.from(header)
}

function toHex(buf) {
  return Buffer.from(buf).toString('hex')
}

// Decode a frame back to a message (used by the round-trip test).
function decodeFrame(buf) {
  return m.message.decode(c.state(0, buf.length, buf))
}

module.exports = { encodeFrame, toHex, decodeFrame }
