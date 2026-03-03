export interface SqlParameter {
  name: string
  camelCase: string
}

export interface SqlColumn {
  name: string
  camelCase: string
}

export interface SqlParseResult {
  parameters: SqlParameter[]
  columns: SqlColumn[]
}

function toCamelCase(str: string): string {
  if (!str.includes('_') && !str.includes('-')) {
    if (str === str.toUpperCase()) {
      return str.toLowerCase()
    }
    return str.charAt(0).toLowerCase() + str.slice(1)
  }
  
  return str
    .toLowerCase()
    .replace(/([-_][a-z0-9])/g, (group) => group.charAt(1).toUpperCase())
}

function extractPostgresParameters(sql: string): SqlParameter[] {
  const regex = /@(\w+)/g
  const matches = new Set<string>()
  let match

  while ((match = regex.exec(sql)) !== null) {
    matches.add(match[1])
  }

  return Array.from(matches).map((name) => ({
    name,
    camelCase: toCamelCase(name),
  }))
}

function extractColumnsString(sql: string): string | null {
  const upperSql = sql.toUpperCase()
  const selectIndex = upperSql.indexOf('SELECT')
  if (selectIndex === -1) return null

  let depth = 0
  let i = selectIndex + 6 // skip "SELECT"

  // Skip whitespace after SELECT
  while (i < sql.length && /\s/.test(sql[i])) i++

  const start = i

  for (; i < sql.length; i++) {
    if (sql[i] === '(') {
      depth++
    } else if (sql[i] === ')') {
      depth--
    } else if (depth === 0) {
      // Check for FROM at depth 0
      if (upperSql.substring(i, i + 4) === 'FROM' && (i === 0 || /\s/.test(sql[i - 1]))) {
        return sql.substring(start, i).trim()
      }
    }
  }

  return null
}

function splitColumnsByComma(columnsStr: string): string[] {
  const result: string[] = []
  let depth = 0
  let current = ''

  for (let i = 0; i < columnsStr.length; i++) {
    if (columnsStr[i] === '(') {
      depth++
      current += columnsStr[i]
    } else if (columnsStr[i] === ')') {
      depth--
      current += columnsStr[i]
    } else if (columnsStr[i] === ',' && depth === 0) {
      result.push(current.trim())
      current = ''
    } else {
      current += columnsStr[i]
    }
  }

  if (current.trim()) {
    result.push(current.trim())
  }

  return result
}

function extractColumns(sql: string): SqlColumn[] {
  const columnsStr = extractColumnsString(sql)

  if (!columnsStr) {
    return []
  }

  const columnTokens = splitColumnsByComma(columnsStr)
  const columns = columnTokens
    .map((trimmed) => {
      const aliasMatch = trimmed.match(/\)\s+AS\s+([^\s]+)$/i) || trimmed.match(/(?:\w+(?:\.\w+)?\s+)?AS\s+([^\s]+)$/i)

      if (aliasMatch) {
        const alias = aliasMatch[1]
        return {
          name: alias.toUpperCase(),
          camelCase: toCamelCase(alias)
        }
      }

      // If it's a subquery without alias, skip it
      if (trimmed.startsWith('(') || /^\([\s\S]+\)$/.test(trimmed)) {
        return { name: '', camelCase: '' }
      }

      const noAlias = trimmed.replace(/\s+AS\s+[^\s]+$/i, '')
      const parts = noAlias.split('.')
      const lastPart = parts[parts.length - 1]
      const name = lastPart.toUpperCase()
      return {
        name,
        camelCase: toCamelCase(name)
      }
    })
    .filter((col) => col.name)

  return columns
}

function extractMySQLParameters(sql: string): SqlParameter[] {
  const regex = /:(\w+)/g
  const matches = new Set<string>()
  let match

  while ((match = regex.exec(sql)) !== null) {
    matches.add(match[1])
  }

  return Array.from(matches).map((name) => ({
    name,
    camelCase: toCamelCase(name),
  }))
}

export function detectDialect(sql: string): 'postgres' | 'mysql' {
  const hasPostgresParam = /@\w+/.test(sql)
  const hasMySQLParam = /:\w+/.test(sql)

  if (hasPostgresParam && !hasMySQLParam) return 'postgres'
  if (hasMySQLParam && !hasPostgresParam) return 'mysql'
  return 'postgres'
}

export function parseSql(sql: string, dialect?: 'postgres' | 'mysql'): SqlParseResult {
  const detectedDialect = dialect || detectDialect(sql)
  const parameters = detectedDialect === 'postgres'
    ? extractPostgresParameters(sql)
    : extractMySQLParameters(sql)

  return {
    parameters,
    columns: extractColumns(sql),
  }
}

export function generateInputMapping(result: SqlParseResult): string {
  const params = result.parameters.map((p) => `${p.name}: criteria.${p.name}`).join(',\n      ')

  return `'use strict';

module.exports = function (input) {
    const criteria = input?.data?.criteria;

    const output = {
        parameters: {
            ${params},
        },
    };

    return output;
};`
}

export function generateInputSchema(result: SqlParseResult): string {
  const properties = result.parameters.map((p) => `
                "${p.name}": {
                    "type": "string"
                }`).join(',')

  const required = result.parameters.map((p) => `"${p.name}"`).join(', ')

  return `{
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "additionalProperties": false,
    "properties": {
        "criteria": {
            "type": "object",
            "additionalProperties": false,
            "properties": {${properties}
            },
            "required": [${required}]
        }
    }
}`
}

export function generateResultMapping(result: SqlParseResult): string {
  const jsonColumns = ['BODY', 'COMMON_BODY', 'SNAPSHOT_BODY']
  
  const mappings = result.columns.map((c) => {
    const isJsonColumn = jsonColumns.includes(c.name.toUpperCase())
    const valueExpression = isJsonColumn ? `JSON.parse(input.${c.name})` : `input.${c.name}`
    
    return `
    output.${c.camelCase} = ${valueExpression};`
  }).join('')
  
  return `'use strict';

module.exports = function resultMapping(input) {
    const output = {};
${mappings}
\n    return output;
};`
}

export function generateResultSchema(result: SqlParseResult): string {
  const jsonColumns = ['body', 'commonbody', 'snapshotbody']
  
  const properties = result.columns.map((c) => {
    if (['SEQ_NUMBER', 'AMENDMENT_NUMBER'].includes(c.name)) {
      return `
        "${c.camelCase}": {
            "type": "integer"
        }`
    }
    
    if (jsonColumns.includes(c.camelCase.toLowerCase())) {
      return `
        "${c.camelCase}": {
            "type": "object",
            "additionalProperties": true
        }`
    }
    
    return `
        "${c.camelCase}": {
            "type": "string"
        }`
  }).join(',')

  return `{
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "additionalProperties": false,
    "properties": {${properties}
    }
}`
}
