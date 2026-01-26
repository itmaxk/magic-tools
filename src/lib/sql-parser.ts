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

function extractPostgresColumns(sql: string): SqlColumn[] {
  const selectRegex = /SELECT\s+([\s\S]+?)\s+FROM/i
  const match = sql.match(selectRegex)

  if (!match) {
    return []
  }

  const columnsStr = match[1]
  const columns = columnsStr
    .split(',')
    .map((col) => {
      const trimmed = col.trim()
      const aliasMatch = trimmed.match(/(?:\w+(?:\.\w+)?\s+)?AS\s+([^\s]+)$/i)
      
      if (aliasMatch) {
        const alias = aliasMatch[1]
        return {
          name: alias.toUpperCase(),
          camelCase: toCamelCase(alias)
        }
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

function extractMySQLColumns(sql: string): SqlColumn[] {
  const selectRegex = /SELECT\s+([\s\S]+?)\s+FROM/i
  const match = sql.match(selectRegex)

  if (!match) {
    return []
  }

  const columnsStr = match[1]
  const columns = columnsStr
    .split(',')
    .map((col) => {
      const trimmed = col.trim()
      const aliasMatch = trimmed.match(/(?:\w+(?:\.\w+)?\s+)?AS\s+([^\s]+)$/i)
      
      if (aliasMatch) {
        const alias = aliasMatch[1]
        return {
          name: alias.toUpperCase(),
          camelCase: toCamelCase(alias)
        }
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

export function detectDialect(sql: string): 'postgres' | 'mysql' {
  const hasPostgresParam = /@\w+/.test(sql)
  const hasMySQLParam = /:\w+/.test(sql)

  if (hasPostgresParam && !hasMySQLParam) return 'postgres'
  if (hasMySQLParam && !hasPostgresParam) return 'mysql'
  return 'postgres'
}

export function parseSql(sql: string, dialect?: 'postgres' | 'mysql'): SqlParseResult {
  const detectedDialect = dialect || detectDialect(sql)
  if (detectedDialect === 'postgres') {
    return {
      parameters: extractPostgresParameters(sql),
      columns: extractPostgresColumns(sql),
    }
  } else {
    return {
      parameters: extractMySQLParameters(sql),
      columns: extractMySQLColumns(sql),
    }
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
