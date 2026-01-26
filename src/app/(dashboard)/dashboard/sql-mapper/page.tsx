'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { parseSql, detectDialect, generateInputMapping, generateInputSchema, generateResultMapping, generateResultSchema } from '@/lib/sql-parser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { sharedStyles } from '@/styles/shared'

interface MappingTextareaProps {
  value: string
  setValue: (val: string) => void
  tabValue: string
  filename: string
  editingTab: string | null
  setEditingTab: (tab: string | null) => void
  onCopy: (text: string) => void
  onDownload: (content: string, filename: string) => void
}

function MappingTextarea({
  value,
  setValue,
  tabValue,
  filename,
  editingTab,
  setEditingTab,
  onCopy,
  onDownload
}: MappingTextareaProps) {
  const isEditing = editingTab === tabValue

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={!isEditing}
        onClick={!isEditing ? () => onCopy(value) : undefined}
        className={isEditing ? '' : 'cursor-pointer active-textarea'}
        rows={20}
      />
      <div className="flex gap-2">
        <Button onClick={() => onCopy(value)}>Copy</Button>
        <Button onClick={() => setEditingTab(isEditing ? null : tabValue)}>
          {isEditing ? 'Save' : 'Edit'}
        </Button>
        <Button onClick={() => onDownload(value, filename)}>Download</Button>
      </div>
    </div>
  )
}

export default function SqlMapperPage() {
  const [sql, setSql] = useState('')
  const [inputMapping, setInputMapping] = useState('')
  const [inputSchema, setInputSchema] = useState('')
  const [resultMapping, setResultMapping] = useState('')
  const [resultSchema, setResultSchema] = useState('')
  const [sqlColumns, setSqlColumns] = useState('')
  const [attributes, setAttributes] = useState('')
  const [editingTab, setEditingTab] = useState<string | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const dialect: 'postgres' | 'mysql' = sql.trim() ? detectDialect(sql) : 'postgres'

  const handleParse = useCallback(() => {
    const result = parseSql(sql)
    setInputMapping(generateInputMapping(result))
    setInputSchema(generateInputSchema(result))
    setResultMapping(generateResultMapping(result))
    setResultSchema(generateResultSchema(result))
    setSqlColumns(result.columns.map(c => c.name).join('\n'))
    setAttributes(result.columns.map(c => c.camelCase).join('\n'))
  }, [sql])

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (sql.trim()) {
        handleParse()
      }
    }, 500)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [sql, handleParse])

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
          <CardTitle>SQL Mapper Tool</CardTitle>
          <CardDescription>Parse SQL queries and generate mapping files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Detected Dialect:</Label>
            <span className="px-2 py-1 text-sm font-medium rounded bg-primary/10 text-primary">
              {dialect === 'postgres' ? 'PostgreSQL' : 'MySQL'}
            </span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sql">SQL Query</Label>
            <Textarea
              id="sql"
              placeholder="Enter your SQL query here..."
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={10}
            />
          </div>
          <Button onClick={handleParse}>Parse SQL</Button>
        </CardContent>
      </Card>

      {inputMapping && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Mappings</CardTitle>
          </CardHeader>
          <CardContent>
              <Tabs defaultValue="inputMapping">
                <style>{sharedStyles}</style>
                 <TabsList className="border-b">
                  <TabsTrigger value="inputMapping">inputMapping.js</TabsTrigger>
                  <TabsTrigger value="inputSchema">inputSchema.json</TabsTrigger>
                  <TabsTrigger value="resultMapping">resultMapping.js</TabsTrigger>
                  <TabsTrigger value="resultSchema">resultSchema.json</TabsTrigger>
                  <TabsTrigger value="sqlColumns">SQL columns</TabsTrigger>
                  <TabsTrigger value="attributes">Attributes</TabsTrigger>
                </TabsList>
                 <TabsContent value="inputMapping" className="space-y-4">
                  <MappingTextarea
                    value={inputMapping}
                    setValue={setInputMapping}
                    tabValue="inputMapping"
                    filename="inputMapping.js"
                    editingTab={editingTab}
                    setEditingTab={setEditingTab}
                    onCopy={copyToClipboard}
                    onDownload={downloadFile}
                  />
                </TabsContent>
                 <TabsContent value="inputSchema" className="space-y-4">
                  <MappingTextarea
                    value={inputSchema}
                    setValue={setInputSchema}
                    tabValue="inputSchema"
                    filename="inputSchema.json"
                    editingTab={editingTab}
                    setEditingTab={setEditingTab}
                    onCopy={copyToClipboard}
                    onDownload={downloadFile}
                  />
                </TabsContent>
                 <TabsContent value="resultMapping" className="space-y-4">
                  <MappingTextarea
                    value={resultMapping}
                    setValue={setResultMapping}
                    tabValue="resultMapping"
                    filename="resultMapping.js"
                    editingTab={editingTab}
                    setEditingTab={setEditingTab}
                    onCopy={copyToClipboard}
                    onDownload={downloadFile}
                  />
                </TabsContent>
                 <TabsContent value="resultSchema" className="space-y-4">
                  <MappingTextarea
                    value={resultSchema}
                    setValue={setResultSchema}
                    tabValue="resultSchema"
                    filename="resultSchema.json"
                    editingTab={editingTab}
                    setEditingTab={setEditingTab}
                    onCopy={copyToClipboard}
                    onDownload={downloadFile}
                  />
                </TabsContent>
                 <TabsContent value="sqlColumns" className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      value={sqlColumns}
                      readOnly
                      rows={20}
                      onClick={() => copyToClipboard(sqlColumns)}
                      className="cursor-pointer active-textarea"
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => copyToClipboard(sqlColumns)}>Copy</Button>
                      <Button onClick={() => downloadFile(sqlColumns, 'sql-columns.txt')}>
                        Download
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                 <TabsContent value="attributes" className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      value={attributes}
                      readOnly
                      rows={20}
                      onClick={() => copyToClipboard(attributes)}
                      className="cursor-pointer active-textarea"
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => copyToClipboard(attributes)}>Copy</Button>
                      <Button onClick={() => downloadFile(attributes, 'attributes.txt')}>
                        Download
                      </Button>
                    </div>
                  </div>
                </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
