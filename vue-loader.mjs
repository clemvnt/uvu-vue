import {
  parse,
  compileScript,
  compileTemplate,
  rewriteDefault
} from '@vue/compiler-sfc'
import { URL, pathToFileURL, fileURLToPath } from 'url'
const baseURL = pathToFileURL(`${process.cwd()}/`).href
const isWindows = process.platform === 'win32'
const extensionsRegex = /\.vue$/
const COMP_IDENTIFIER = `__sfc__`

export function resolve(specifier, context, defaultResolve) {
  if (!extensionsRegex.test(specifier)) {
    return defaultResolve(specifier, context, defaultResolve)
  }

  const { parentURL = baseURL } = context

  const url = new URL(specifier, parentURL).href
  return { url }
}

export function getFormat(url, context, defaultGetFormat) {
  if (!extensionsRegex.test(url)) {
    return defaultGetFormat(url, context, defaultGetFormat)
  }

  return {
    format: 'module'
  }
}

export function transformSource(source, context, defaultTransformSource) {
  const { url } = context

  if (!extensionsRegex.test(url)) {
    return defaultTransformSource(source, context, defaultTransformSource)
  }

  let filename = isWindows ? url : fileURLToPath(url)

  const { descriptor, errors } = parse(source.toString(), { filename })
  if (errors.length > 0) {
    errors.forEach((error) => console.error(error))
  }

  const id = filename

  const [compiledScript, bindings] = doCompileScript(descriptor, id, false)
  let code = compiledScript

  if (descriptor.template && !descriptor.scriptSetup) {
    let compiledTemplate = doCompileTemplate(descriptor, id, bindings, false)
    code += compiledTemplate
  }

  code += `\nexport default ${COMP_IDENTIFIER}`

  return {
    source: code
  }
}

function doCompileScript(descriptor, id, ssr) {
  if (descriptor.script || descriptor.scriptSetup) {
    const compiledScript = compileScript(descriptor, {
      id,
      refSugar: true,
      inlineTemplate: true,
      templateOptions: {
        ssr,
        ssrCssVars: descriptor.cssVars
      }
    })
    let code = ''
    if (compiledScript.bindings) {
      code += `\n/* Analyzed bindings: ${JSON.stringify(
        compiledScript.bindings,
        null,
        2
      )} */`
    }
    code += `\n` + rewriteDefault(compiledScript.content, COMP_IDENTIFIER)

    return [code, compiledScript.bindings]
  } else {
    return [`\nconst ${COMP_IDENTIFIER} = {}`, undefined]
  }
}

function doCompileTemplate(descriptor, id, bindingMetadata, ssr) {
  const templateResult = compileTemplate({
    source: descriptor.template.content,
    filename: descriptor.filename,
    id,
    scoped: descriptor.styles.some((s) => s.scoped),
    slotted: descriptor.slotted,
    ssr,
    ssrCssVars: descriptor.cssVars,
    isProd: false,
    compilerOptions: {
      bindingMetadata
    }
  })
  if (templateResult.errors.length) {
    store.errors = templateResult.errors
    return
  }

  const fnName = ssr ? `ssrRender` : `render`

  return (
    `\n${templateResult.code.replace(
      /\nexport (function|const) (render|ssrRender)/,
      `$1 ${fnName}`
    )}` + `\n${COMP_IDENTIFIER}.${fnName} = ${fnName}`
  )
}
