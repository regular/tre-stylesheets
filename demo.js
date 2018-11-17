const {client} = require('tre-client')
const Styles = require('.')
const h = require('mutant/html-element')
const setStyle = require('module-styles')('tre-styles-demo')
const Finder = require('tre-finder')
const Importer = require('tre-file-importer')
const WatchMerged = require('tre-prototypes')
const {makePane, makeDivider, makeSplitPane} = require('tre-split-pane')
const Value = require('mutant/value')
const computed = require('mutant/computed')

require('brace/theme/twilight')

setStyle(`
  body, html, .tre-images-demo {
    height: 100%;
    margin: 0;
    padding: 0;
  }
  body {
    --tre-selection-color: green;
    --tre-secondary-selection-color: yellow;
    font-family: sans-serif;
  }
  h1 {
    font-size: 18px;
  }
  .pane {
    background: #eee;
  }
  .tre-finder .summary select {
    font-size: 9pt;
    background: transparent;
    border: none;
    width: 50px;
  }
  .tre-finder summary {
    white-space: nowrap;
  }
  .tre-finder summary:focus {
    outline: 1px solid rgba(255,255,255,0.1);
  }
  .tre-styles-editor {
    max-width: 500px;
  }
`)

client( (err, ssb, config) => {
  if (err) return console.error(err)

  const watchMerged = WatchMerged(ssb)
  const primarySelection = Value()
  const merged_kv = computed(primarySelection, kv => {
    const c = content(kv)
    if (!c) return
    return watchMerged(c.revisionRoot || kv.key)
  })

  console.log('config', config)
  const importer = Importer(ssb, config)
  importer.use(require('./common'))
  
  console.log('common', require('./common'))

  const renderFinder = Finder(ssb, {
    importer,
    primarySelection,
    skipFirstLevel: true,
    details: (kv, ctx) => {
      return kv && kv.meta && kv.meta["prototype-chain"] ? h('i', '(has proto)') : []
    }
  })

  const renderStyle = Styles(ssb, {
    ace_theme: 'ace/theme/twilight'
  })

  const where = Value('editor')

  document.body.appendChild(h('.tre-images-demo', [
    makeSplitPane({horiz: true}, [
      makePane('25%', [
        renderFinder(config.tre.branches.stylesheets || config.tre.branches.root)
      ]),
      makeDivider(),
      makePane('70%', [
        h('.bar', [
          h('select', {
            'ev-change': e => {
              where.set(e.target.value)
            }
          }, [
            h('option', 'editor'),
            h('option', 'stage'),
            h('option', 'thumbnail')
          ])
        ]),
        computed([where, merged_kv], (where, kv) => kv ? renderStyle(kv, {where}) : [])
      ])
    ])
  ]))
})

function content(kv) {
  return kv && kv.value && kv.value.content
}

