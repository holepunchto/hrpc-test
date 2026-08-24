const fs = require('fs')
const path = require('path')

// `dispatch-sparse` is the discriminating counterpart to `dispatch`: its declared
// command ids are non-contiguous, so registration order and declared id produce
// different bytes. `dispatch` alone cannot tell the two readings apart.
const FAMILIES = ['envelope', 'error', 'boundary', 'dispatch', 'dispatch-sparse']

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

// Families with {messages.json, frames.json} (index-aligned).
function loadFamily(name) {
  const dir = path.join(__dirname, 'fixtures', name)
  return {
    messages: readJSON(path.join(dir, 'messages.json')),
    frames: readJSON(path.join(dir, 'frames.json'))
  }
}

// {hex, reason}[] a conformant decoder must reject.
function loadNegative() {
  return readJSON(path.join(__dirname, 'fixtures', 'negative', 'frames.json'))
}

// { concatenated, count } - one byte stream of several frames.
function loadSequence() {
  return readJSON(path.join(__dirname, 'fixtures', 'sequence', 'frames.json'))
}

module.exports = {
  families: FAMILIES,
  fixturesDir: path.join(__dirname, 'fixtures'),
  loadFamily,
  loadNegative,
  loadSequence
}
