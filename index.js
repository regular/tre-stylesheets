const h = require('mutant/html-element')
const Value = require('mutant/value')
const computed = require('mutant/computed')
const watch = require('mutant/watch')
const setStyle = require('module-styles')('tre-stylesheets')
const Str = require('tre-string')
const ace = require('brace')
require('brace/mode/css')

setStyle(`
  .tre-stylesheet-editor pre.editor {
    width: 90%;
    min-height: 200px;
  }
`)

function renderCSS(kv, ctx) {
  const content = kv && kv.value && kv.value.content
  let css = content && content.css || ''
  if (ctx && ctx.contentObs) {
    css = computed(ctx.contentObs, content => {
      return content && content.css || ''
    })
  }
  return h('style', {
    attributes: {
      'data-key': kv.key
    }
  }, css)
}

function RenderEditor(ssb, opts) {
  return function renderEditor(kv, ctx) {
    ctx = ctx || {}
    const content = kv.value && kv.value.content
    const name = Value(content.name)
    const css = content.css
    const contentLength = Value(css.length)
    const syntaxError = ctx.syntaxErrorObs || Value()
    const contentObs = ctx.contentObs || Value()
    contentObs.set(content)

    const compact = where == 'compact-editor'

    renderStr = Str({
      save: text => {
        name.set(text)
        contentObs.set(Object.assign({}, contentObs(), {name: text}))
      }
    })

    const pre = h('pre.editor', css)

    const editor = ace.edit(pre)
    if (opts.ace_theme) editor.setTheme(opts.ace_theme)
    editor.session.setMode('ace/mode/css')

    if (ctx.where == 'compact-editor') {
      editor.renderer.setShowGutter(false)
    }

    editor.session.on('change', Changes(editor, 600, (err, content) => {
      contentLength.set(content.css.length)
      contentObs.set(Object.assign({}, contentObs(), content))
    }))

    editor.session.on('changeAnnotation', () => {
      const ans = editor.session.getAnnotations()
      if (ans.length !== 0) {
        syntaxError.set(ans[0].text)
      } else {
        syntaxError.set(null)
      }
    })

    function setNewContent(newContent) {
      const oldCss = editor.session.getValue()
      if (newContent.css == oldCss) return

      const currentPosition = editor.selection.getCursor()
      const scrollTop = editor.session.getScrollTop()
      editor.session.setValue(newContent.css)
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
      h('h1', renderStr(computed(name, n => n ? n : 'No Name'))),
      pre,
      ctx.where == 'compact-editor' ? renderCSS(kv, ctx) : [],
      h('div', [
        h('span.bytesLeft', computed(contentLength, len => `${8192 - 512 - len} characters left`)),
        h('span.error', syntaxError)
      ])
    ])
  }
}

module.exports = function(ssb, opts) {
  opts = opts || {}
  const renderEditor = RenderEditor(ssb, opts)

  return function render(kv, ctx) {
    ctx = ctx || {}
    const content = kv.value && kv.value.content
    if (content.type !== 'stylesheet') return

    if (ctx.where == 'thumbnail') {
      return h('pre', 'css')
    } else if (ctx.where == 'editor' || ctx.where == 'compact-editor') {
      return renderEditor(kv, ctx)
    } else if (ctx.where == 'tile') {
      return
    }
    return renderCSS(kv, ctx)
  }
}

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

