'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { checkAiAvailability, checkGitlabConnection, fetchMergeRequestDetails, fetchSonarIssuesAction, generateAIFixesAction, postIssuesToGitLab, postAIFixesToGitLab } from '@/actions/sonar-actions'
import { sharedStyles } from '@/styles/shared'

export default function SonarLogsPage() {
  const [gitlabUrl, setGitlabUrl] = useState('')
  const [sonarUrl, setSonarUrl] = useState('')
  const [issues, setIssues] = useState('')
  const [aiFixes, setAiFixes] = useState('')
  const [isAiAvailable, setIsAiAvailable] = useState(false)
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
      } catch (error) {
        console.error('Error checking connections:', error)
      }
    }
    checkConnections()
  }, [])

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

    setLoading(true)
    try {
      const result = await generateAIFixesAction(issues)
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
            <Label htmlFor="gitlab-url">GitLab Merge Request URL</Label>
            <Input
              id="gitlab-url"
              placeholder="https://gitlabru.dot.com/life/implementation/-/merge_requests/12767"
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
              placeholder="https://qube.dot.com/dashboard?id=configuration&pullRequest=12767"
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

      {isAiAvailable && (
        <>
          {issues && !isAiFixesVisible && (
            <Button onClick={handleGenerateFixes} disabled={loading} className="w-full">
              {loading ? 'Generating...' : 'Generate AI Fixes'}
            </Button>
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
