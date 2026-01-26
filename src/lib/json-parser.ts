export interface JsonTemplate {
  name: string
  value: string
}

export const jsonTemplates: JsonTemplate[] = [
  {
    name: 'User input',
    value: `"to_replace_attribute": {
    "type": "string",
    "aiTitle": "to_replace_attribute"
}`
  },
  {
    name: 'dataSchema.json',
    value: `{
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "NewDataSchemaTitle",
    "type": "object",
    "additionalProperties": false,
    "properties": {
        "to_replace_attribute": {
            "type": "string",
            "aiTitle": "to_replace_attribute"
        }
    }
}`
  }
]

export interface JsonParseResult {
  template: string
  attributes: string[]
  generated: string
}

export function parseJsonSchema(template: string, attributes: string): JsonParseResult {
  const attrList = attributes
    .split('\n')
    .map(a => a.trim())
    .filter(a => a.length > 0)

  const generated = replaceAttributes(template, attrList)

  return {
    template,
    attributes: attrList,
    generated
  }
}

function replaceAttributes(template: string, attributes: string[]): string {
  if (!template || !template.trim()) {
    return template
  }

  const marker = '"to_replace_attribute": {'

  if (!template.includes(marker)) {
    return template
  }

  const startIndex = template.indexOf(marker)
  let braceCount = 1
  let endIndex = startIndex + marker.length - 1

  while (braceCount > 0 && endIndex < template.length) {
    endIndex++
    if (template[endIndex] === '{') braceCount++
    if (template[endIndex] === '}') braceCount--
  }

  const newProperties = attributes
    .map(attr => `    "${attr}": {
        "type": "string",
        "aiTitle": "${attr}"
    }`)
    .join(',\n')

  const before = template.substring(0, startIndex)
  const after = template.substring(endIndex + 1)

  return before + newProperties + after
}

export function generateDataSchema(result: JsonParseResult): string {
  try {
    const parsed = JSON.parse(result.generated)
    return JSON.stringify(parsed, null, 4)
  } catch {
    return result.generated
  }
}

