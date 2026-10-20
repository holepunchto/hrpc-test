const fs = require('fs')
const path = require('path')
const wire = require('bare-rpc-test')

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const fixturesDir = path.join(__dirname, 'fixtures')

const own = readJSON(path.join(fixturesDir, 'families.json'))

function loadFamily(name) {
  if (!own.includes(name)) return wire.loadFamily(name)

  const dir = path.join(fixturesDir, name)
  return {
    messages: readJSON(path.join(dir, 'messages.json')),
    frames: readJSON(path.join(dir, 'frames.json'))
  }
}

module.exports = {
  families: [...wire.families, ...own],
  fixturesDir,
  loadFamily,
  loadNegative: wire.loadNegative,
  loadDecodeOnly: wire.loadDecodeOnly,
  loadSequence: wire.loadSequence
}
