const pull = require('pull-stream')
const BufferList = require('bl')

module.exports = {
  importFile,
  factory
}

function importFile(ssb, file, source, opts, cb) {
  opts = opts || {}
  const prototypes = opts.prototypes || {}
  const fileProps = Object.assign({}, file)
  if (file.type !== 'text/css') return cb(true)
  const bl = BufferList()
  pull(
    source,
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
