const h = require('mutant/html-element')
const Value = require('mutant/value')
const computed = require('mutant/computed')
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
  const content = kv.value && kv.value.content
  const css = content && content.css || ''
  return h('style', {
    attributes: {
      'data-key': kv.key
    }
  }, css)
}

function RenderEditor(ssb, opts) {
  return function renderEditor(kv, ctx) {
    const content = kv.value && kv.value.content
    const name = Value(content.name)
    const css = content.css

    renderStr = Str({
      save: text => {
        name.set(text)
      }
    })

    const pre = h('pre.editor', css)

    const editor = ace.edit(pre)
    if (opts.ace_theme) editor.setTheme(opts.ace_theme)
    editor.session.setMode('ace/mode/css')

    return h('.tre-stylesheet-editor', [
      h('h1', renderStr(computed(name, n => n ? n : 'No Name'))),
      pre,
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
    } else if (ctx.where == 'editor') {
      return renderEditor(kv, ctx)
    } else if (ctx.where == 'tile') {
      return
    }
    return renderCSS(kv, ctx)
  }
}


