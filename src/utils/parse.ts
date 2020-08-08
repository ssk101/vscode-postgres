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
  const varBaseRegex = /([a-zA-Z_]*)(?=::[a-zA-Z_]*(\[\]\s|\s|,)(AS|,|\n|\r))/gm
  const varNameRegex = /(?<=([a-zA-Z*]\s:|[\s*]:))([a-zA-Z_]*)(?=(\n|$|::[a-zA-Z_]*(\[\]\s|\s|,)(AS|,|\n|\r)))/gm
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
      line = line.replace(re, (match) => {
        const value = definedVars[match.replace(/:/, '')]
        return value
      })
    }
    return line
  }).join('\n')

  Object.keys(definedVars).forEach(v => {
    const re = new RegExp(
      /(--\s|)/.source + definedFullRegex.source,
      definedFullRegex.flags
    )
    sql = sql.replace(re, '')
  })

  return sql
}
