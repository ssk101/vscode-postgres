import { OutputChannel } from '../common/outputChannel'
import * as vscode from 'vscode'

export function parseVars(sql) {
  const defiedKeywordRegex = /(#define\s)/
  const definedBaseRegex = /([a-zA-Z_]*)(\s\=\s)(.*)/gm
  const definedFullRegex = new RegExp(
    defiedKeywordRegex.source + definedBaseRegex.source,
    definedBaseRegex.flags
  )
  const definedKVRegex = new RegExp(
    /(?<=#define\s)/.source + definedBaseRegex.source,
    definedBaseRegex.flags
  )
  const varNameRegex = /(?<!::)(?<=\s*(\w*|^))(?<=(^|\s|\():)(\w*)(?=:|\n|$)/gm
  const vars = sql.match(varNameRegex)
  const definedMatches = sql.match(definedKVRegex)

  if(!definedMatches) {
    return sql
  }

  const definedVars = definedMatches.reduce((acc, cur) => {
    const matched = cur.match(/([a-zA-Z_]*)(\s\=\s)(.*)/)
    if(matched[1] && matched[3]) {
        acc[matched[1]] = matched[3]
    }
    return acc
  }, {})

  var missing = vars.filter(v => {
    v = v.replace(/:/g, '').trim()
    return !Object.keys(definedVars).includes(v)
  })

  if(missing.length) {
    const err = `One or more variables have not been defined: ${missing.join(', ')}`
    OutputChannel.appendLine(err)
    vscode.window.showErrorMessage(err)
    return ''
  }

  sql = sql.split('\n').map(line => {
    if (definedVars) {
      const re = new RegExp(/:/.source + varNameRegex.source, varNameRegex.flags)
      line = line.trim().replace(re, (match) => {
        const value = definedVars[match.replace(/:/, '')]
        return value.trim()
      })
    }
    return line
  }).join('\n')

  // Remove #define vars
  Object.keys(definedVars).forEach(v => {
    const re = new RegExp(
      /(--\s|)/.source + definedFullRegex.source,
      definedFullRegex.flags
    )
    sql = sql.replace(re, '')
  })

  console.log(sql)

  return sql
}
