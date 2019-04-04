const h = require('mutant/html-element')
const Value = require('mutant/value')
const computed = require('mutant/computed')
const watch = require('mutant/watch')
const setStyle = require('module-styles')('tre-stylesheets')
const Str = require('tre-string')
const ace = require('brace')
const {importFiles, factory} = require('./common')
require('brace/mode/css')

setStyle(`
  .tre-stylesheet-editor pre.editor {
    width: 90%;
    min-height: 200px;
  }
`)


module.exports = function(ssb, opts) {
  opts = opts || {}

  return function render(kv, ctx) {
    ctx = ctx || {}
    const content = kv && kv.value && kv.value.content
    if (content.type !== 'stylesheet') return

    const contentObs = ctx.contentObs || Value({})

    const previewObs = ctx.previewObs || Value(kv)
    const cssObs = computed(previewObs, kv => kv && kv.value.content.css || '')

    if (ctx.where == 'thumbnail' || ctx.where == 'tile') {
      return h('pre', 'css')
    } else if (ctx.where == 'editor' || ctx.where == 'compact-editor') {
      return renderEditor()
    }
    return renderCSS()

    function renderCSS() {
      return h('style', {
        attributes: {
          'data-key': kv.key
        }
      }, cssObs)
    }

    function renderEditor() {
      const nameObs = computed(previewObs, kv => kv && kv.value.content.name)

      const syntaxErrorObs = ctx.syntaxErrorObs || Value()
      const contentLengthObs = computed(contentObs, c => JSON.stringify(c).length)
      const compact = ctx.where == 'compact-editor'

      function set(o) {
        contentObs.set(Object.assign({}, contentObs(), o))
      }

      const renderStr = Str({
        save: name => set({name})
      })

      const pre = h('pre.editor', cssObs())

      const editor = ace.edit(pre)
      if (opts.ace_theme) editor.setTheme(opts.ace_theme)
      editor.session.setMode('ace/mode/css')

      editor.session.on('change', Changes(editor, 600, (err, content) => {
        set(content)
      }))

      editor.session.on('changeAnnotation', () => {
        const ans = editor.session.getAnnotations()
        if (ans.length !== 0) {
          syntaxErrorObs.set(ans[0].text)
        } else {
          syntaxErrorObs.set(null)
        }
      })

      function setNewContent(newContent) {
        const oldCss = editor.session.getValue()
        if (newContent.css == oldCss) return

        const currentPosition = editor.selection.getCursor()
        const scrollTop = editor.session.getScrollTop()
        editor.session.setValue(newContent.css || '')
        editor.clearSelection()
        editor.gotoLine(currentPosition.row + 1, currentPosition.column);
        editor.session.setScrollTop(scrollTop)
      }

      const abort = watch(contentObs, newContent => {
        setNewContent(newContent)
      })

      return h(`.tre-stylesheet-editor${compact ? '.compact': ''}`, {
        hooks: [el => abort]
      }, [
        h('h1', renderStr(computed(nameObs, n => n ? n : 'No Name'))),
        pre,
        ctx.where == 'compact-editor' ? renderCSS(kv, ctx) : [],
        h('div', [
          // move to editor shell
          h('span.bytesLeft', computed(contentLengthObs, len => `${8192 - 512 - len} characters left`)),
          h('span.error', syntaxErrorObs)
        ])
      ])
    }

  }
}

module.exports.importFiles = importFiles
module.exports.factory = factory

// -- utils

function Changes(editor, ms, cb) {
  return debounce(ms, ()=>{
    const css = editor.session.getValue() 
    const content = {css}
    cb(null, content)
  })
}

function debounce(ms, f) {
  let timerId

  return function() {
    if (timerId) clearTimeout(timerId)
    timerId = setTimeout(()=>{
      timerid = null
      f()
    }, ms)
  }
}

