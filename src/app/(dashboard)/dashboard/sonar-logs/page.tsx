'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { checkAiAvailability, checkGitlabConnection, fetchMergeRequestDetails, fetchSonarIssuesAction, generateAIFixesAction, postIssuesToGitLab, postAIFixesToGitLab } from '@/actions/sonar-actions'
import { sharedStyles } from '@/styles/shared'

export default function SonarLogsPage() {
  const [gitlabMrId, setGitlabMrId] = useState('')
  const [gitlabUrl, setGitlabUrl] = useState('')
  const [sonarUrl, setSonarUrl] = useState('')
  const [urlConfig, setUrlConfig] = useState<{ gitlabUrl: string | null; gitlabProject: string | null; sonarUrl: string | null; sonarProject: string | null }>({
    gitlabUrl: null,
    gitlabProject: null,
    sonarUrl: null,
    sonarProject: null
  })
  const [issues, setIssues] = useState('')
  const [aiFixes, setAiFixes] = useState('')
  const [isAiAvailable, setIsAiAvailable] = useState<{ openai: boolean; zai: boolean }>({ openai: false, zai: false })
  const [aiProvider, setAiProvider] = useState<'openai' | 'zai'>('openai')
  const [isAiFixesVisible, setIsAiFixesVisible] = useState(false)
  const [hasGitlabConnection, setHasGitlabConnection] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function checkConnections() {
      try {
        const [aiAvailable, gitlabConnected] = await Promise.all([
          checkAiAvailability(),
          checkGitlabConnection()
        ])
        setIsAiAvailable(aiAvailable)
        setHasGitlabConnection(gitlabConnected)
        
        if (!aiAvailable.openai && aiAvailable.zai) {
          setAiProvider('zai')
        }
      } catch (error) {
        console.error('Error checking connections:', error)
      }
    }
    checkConnections()
  }, [])

  useEffect(() => {
    async function fetchUrlConfig() {
      try {
        const response = await fetch('/api/urls')
        const config = await response.json()
        setUrlConfig(config)
      } catch (error) {
        console.error('Error fetching URL config:', error)
      }
    }
    fetchUrlConfig()
  }, [])

  useEffect(() => {
    if (gitlabMrId && urlConfig.gitlabUrl && urlConfig.gitlabProject) {
      const generatedGitlabUrl = `${urlConfig.gitlabUrl}/${urlConfig.gitlabProject}/implementation/-/merge_requests/${gitlabMrId}`
      setGitlabUrl(generatedGitlabUrl)
      
      if (urlConfig.sonarUrl && urlConfig.sonarProject) {
        const generatedSonarUrl = `${urlConfig.sonarUrl}/component_measures?id=${urlConfig.sonarProject}&pullRequest=${gitlabMrId}&issueStatuses=OPEN`
        setSonarUrl(generatedSonarUrl)
      }
    }
  }, [gitlabMrId, urlConfig])

  async function handleFetchFromGitlab() {
    if (!gitlabUrl) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter GitLab MR URL'
      })
      return
    }

    setLoading(true)
    try {
      const result = await fetchMergeRequestDetails(gitlabUrl)
      if (result.sonarUrl) {
        setSonarUrl(result.sonarUrl)
        toast({
          title: 'Success',
          description: 'SonarQube link found and set'
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Link not found',
          description: 'Could not find "See analysis details on SonarQube" link. Please enter SonarQube URL manually.'
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch from GitLab'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleFetchIssues() {
    if (!sonarUrl) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter SonarQube URL'
      })
      return
    }

    setLoading(true)
    try {
      const result = await fetchSonarIssuesAction(sonarUrl)
      setIssues(result)
      toast({
        title: 'Success',
        description: 'Issues fetched successfully'
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch issues'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateFixes() {
    if (!issues) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fetch issues first'
      })
      return
    }

    const available = aiProvider === 'openai' ? isAiAvailable.openai : isAiAvailable.zai
    if (!available) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `${aiProvider.toUpperCase()} API key is not configured. Please add ${aiProvider.toUpperCase()}_API_KEY to .env file`
      })
      return
    }

    setLoading(true)
    try {
      const result = await generateAIFixesAction(issues, aiProvider)
      setAiFixes(result)
      setIsAiFixesVisible(true)
      toast({
        title: 'Success',
        description: 'AI fixes generated successfully'
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate AI fixes'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handlePostIssuesToGitlab() {
    if (!gitlabUrl || !sonarUrl || !issues) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Missing required data'
      })
      return
    }

    setLoading(true)
    try {
      await postIssuesToGitLab(gitlabUrl, sonarUrl, issues)
      toast({
        title: 'Success',
        description: 'Issues posted to GitLab successfully'
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post issues to GitLab'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handlePostAIFixesToGitlab() {
    if (!gitlabUrl || !aiFixes) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Missing required data'
      })
      return
    }

    setLoading(true)
    try {
      await postAIFixesToGitLab(gitlabUrl, aiFixes)
      toast({
        title: 'Success',
        description: 'AI fixes posted to GitLab successfully'
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post AI fixes to GitLab'
      })
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast({
      description: 'Copied to clipboard',
      duration: 2000,
      variant: 'success'
    })
  }

  return (
    <div className="space-y-6">
      <style>{sharedStyles}</style>
      
      <Card>
        <CardHeader>
          <CardTitle>Sonar cube logs</CardTitle>
          <CardDescription>Fetch and analyze SonarQube issues from GitLab merge requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mr-id">MR (Sonar) Id</Label>
            <Input
              id="mr-id"
              placeholder="Enter MR ID (e.g., 12767)"
              value={gitlabMrId}
              onChange={(e) => setGitlabMrId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gitlab-url">GitLab Merge Request URL</Label>
            <Input
              id="gitlab-url"
              placeholder="https://gitlabru.domain.com/life/implementation/-/merge_requests/12767"
              value={gitlabUrl}
              onChange={(e) => setGitlabUrl(e.target.value)}
            />
          </div>
          <Button onClick={handleFetchFromGitlab} disabled={loading}>
            {loading ? 'Fetching...' : 'Fetch from GitLab'}
          </Button>
          
          <div className="space-y-2">
            <Label htmlFor="sonar-url">SonarQube URL</Label>
            <Input
              id="sonar-url"
              placeholder="https://qube.domain.com/project/issues?id=RGSL-configuration&pullRequest=12767&issueStatuses=OPEN"
              value={sonarUrl}
              onChange={(e) => setSonarUrl(e.target.value)}
            />
          </div>
          <Button onClick={handleFetchIssues} disabled={loading}>
            {loading ? 'Fetching...' : 'Fetch Issues'}
          </Button>
        </CardContent>
      </Card>

      {issues && (
        <Card>
          <CardHeader>
            <CardTitle>SonarQube Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={issues}
                readOnly
                rows={20}
                onClick={() => copyToClipboard(issues)}
                className="cursor-pointer active-textarea"
              />
              <div className="flex gap-2">
                <Button onClick={() => copyToClipboard(issues)}>Copy</Button>
                {hasGitlabConnection && (
                  <Button onClick={handlePostIssuesToGitlab} disabled={loading}>
                    {loading ? 'Posting...' : 'Post Issues to GitLab'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(isAiAvailable.openai || isAiAvailable.zai) && (
        <>
          {issues && !isAiFixesVisible && (
            <div className="flex gap-2 items-center w-full">
              <Select value={aiProvider} onValueChange={(value: 'openai' | 'zai') => setAiProvider(value)} disabled={loading}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai" disabled={!isAiAvailable.openai}>OpenAI</SelectItem>
                  <SelectItem value="zai" disabled={!isAiAvailable.zai}>Z.AI</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleGenerateFixes} disabled={loading} className="flex-1">
                {loading ? 'Generating...' : 'Generate AI Fixes'}
              </Button>
            </div>
          )}

          {isAiFixesVisible && (
            <Card>
              <CardHeader>
                <CardTitle>AI Fixes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    value={aiFixes}
                    readOnly
                    rows={20}
                    onClick={() => copyToClipboard(aiFixes)}
                    className="cursor-pointer active-textarea"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => copyToClipboard(aiFixes)}>Copy</Button>
                    {hasGitlabConnection && (
                      <Button onClick={handlePostAIFixesToGitlab} disabled={loading}>
                        {loading ? 'Posting...' : 'Post AI Fixes to GitLab'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
