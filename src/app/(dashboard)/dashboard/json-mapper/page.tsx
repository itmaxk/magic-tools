'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { parseJsonSchema, generateDataSchema, jsonTemplates } from '@/lib/json-parser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { sharedStyles } from '@/styles/shared'

export default function JsonMapperPage() {
  const [template, setTemplate] = useState('')
  const [attributes, setAttributes] = useState('')
  const [generatedSchema, setGeneratedSchema] = useState('')
  const [editing, setEditing] = useState(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const handleTemplateChange = useCallback((value: string) => {
    const selected = jsonTemplates.find(t => t.name === value)
    if (selected) {
      setTemplate(selected.value)
      if (selected.name === 'User input') {
        setAttributes('attr1\nattr2')
        toast({
          description: 'Please set "to_replace_attribute" in your template for replacement',
          duration: 5000,
          variant: 'default'
        })
      }
    }
  }, [toast])

  const handleGenerate = useCallback(() => {
    const result = parseJsonSchema(template, attributes)
    setGeneratedSchema(generateDataSchema(result))
  }, [template, attributes])

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (template.trim()) {
        handleGenerate()
      }
    }, 500)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [template, attributes, handleGenerate])

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast({
      description: 'Copied to clipboard',
      duration: 2000,
      variant: 'success'
    })
  }

  function downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>JSON Mapper Tool</CardTitle>
          <CardDescription>Generate JSON schemas from templates and attributes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template">JSON schema template</Label>
              <Select onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent
                  className="!bg-white !text-black shadow-md z-[9999]"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  style={{ backgroundColor: 'white', color: 'black', border: '1px solid #d1d5db' }}
                >
                  {jsonTemplates.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                id="template"
                placeholder="Enter your JSON schema template here..."
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attributes">Attributes</Label>
              <Textarea
                id="attributes"
                placeholder="Enter attributes (one per line)..."
                value={attributes}
                onChange={(e) => setAttributes(e.target.value)}
                rows={10}
              />
            </div>
          </div>
          <Button onClick={handleGenerate}>Generate</Button>
        </CardContent>
      </Card>

      {generatedSchema && (
        <Card>
          <CardHeader>
            <CardTitle>Generated JSON schema</CardTitle>
          </CardHeader>
          <CardContent>
            <style>{sharedStyles}</style>
            <div className="space-y-2">
              <Textarea
                value={generatedSchema}
                onChange={(e) => setGeneratedSchema(e.target.value)}
                readOnly={!editing}
                onClick={!editing ? () => copyToClipboard(generatedSchema) : undefined}
                className={editing ? '' : 'cursor-pointer active-textarea'}
                rows={20}
              />
              <div className="flex gap-2">
                <Button onClick={() => copyToClipboard(generatedSchema)}>Copy</Button>
                <Button onClick={() => setEditing(!editing)}>
                  {editing ? 'Save' : 'Edit'}
                </Button>
                <Button onClick={() => downloadFile(generatedSchema, 'dataSchema.json')}>
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
