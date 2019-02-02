const pull = require('pull-stream')
const BufferList = require('bl')

module.exports = {
  importFiles,
  factory
}

function importFiles(ssb, files, opts, cb) {
  opts = opts || {}
  const prototypes = opts.prototypes || {}
  if (!prototypes) return cb(new Error('no prototypes'))
  if (files.length>1) return cb(true) // we don't do multiple files
  const file = files[0]
  const fileProps = getFileProps(file)

  if (file.type !== 'text/css') return cb(true)
  const bl = BufferList()
  pull(
    file.source(),
    pull.drain( buffer => bl.append(buffer), err  => {
      if (err) return cb(err)
      const css = bl.toString()
      const name = titleize(file.name)
      const content = {
        type: 'stylesheet',
        prototype: prototypes.stylesheet,
        name,
        file: fileProps,
        css
      }
      return cb(null, content)
    })
  )
}

function titleize(filename) {
  return filename.replace(/\.\w{3,4}$/, '').replace(/-/g, ' ')
}

function factory(config) {
  const type = 'stylesheet'
  return {
    type,
    i18n: {
      'en': 'Stylesheet'
    },
    prototype: function() {
      return {
        type,
        schema: {
          description: 'A cascading stylesheet (CSS)',
          type: 'object',
          required: ['type', 'css'],
          properties: {
            type: { "const": type },
            css: { type: 'string' },
          }
        }
      }
    },
    content: function() {
      return {
        type,
        prototype: config.tre.prototypes[type]
      }
    }
  }
}
// -- utils

function getFileProps(file) {
  // Object.assign does not work with file objects
  return {
    lastModified: file.lastModified,
    name: file.name,
    size: file.size,
    type: file.type,
  }
}
