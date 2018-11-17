const test = require('tape')
const {importFile} = require('../common')
const pull = require('pull-stream')

const TYPE = 'stylesheet'

test('importFile', t => {

  const ssb = {}
  const file = {
    name: 'a-file-name.css',
    size: 20,
    type: 'text/css'
  }
  const source = pull.values(['Hello', 'World'])
  const opts = {
    prototypes: {
      [TYPE]: 'foo'
    }
  }

  importFile(ssb, file, source, opts, (err, result) => {
    console.log(result)
    t.equal(result.type, TYPE, 'has correct type')
    t.equal(result.prototype, 'foo', 'has correct prototype')
    t.deepEqual(result.file, file, 'has file')
    t.ok(result.name, 'has a name')
    t.equal(result.css, 'HelloWorld', 'has css content')
    t.end()
  })
})
