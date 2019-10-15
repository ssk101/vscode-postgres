export function parseVars(sql) {
  const declarationMatch = /(^\#(define))\s(\w*)\s\=\s(.*)/gm
  const varMatch = /(\s|^)(\:(\w*)\w)/g
  const vars = sql.match(declarationMatch)

  sql = sql.split('\n').map(line => {
    if(vars && vars.length) {
      line = line.replace(varMatch, (match) => {
        console.log(match)
        const declaration = vars.find(v => {
          return v.includes(match.replace(/\:/g, '').trim())
        })
        const value = declaration.split(' =').slice().pop()
        return value
      })
    }
    return line
  }).join('\n')

  vars && vars.forEach(v => {
    sql = sql.replace(declarationMatch, '')
    sql = sql.replace(/^\s*$(?:\r\n?|\n)/gm, '')
  })
  return sql
}
