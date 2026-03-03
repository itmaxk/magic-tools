'use server'

import { getMergeRequest, extractSonarLink, postMergeRequestComment, formatGitlabIssuesComment } from '@/lib/gitlab-client'
import { fetchSonarIssues } from '@/lib/sonar-client'

export async function checkGitlabConnection(): Promise<boolean> {
  return !!(process.env.GITLAB_TOKEN && process.env.GITLAB_TOKEN.length > 0)
}

export async function fetchMergeRequestDetails(gitlabUrl: string): Promise<{ sonarUrl: string | null }> {
  try {
    const mr = await getMergeRequest(gitlabUrl)
    const sonarUrl = extractSonarLink(mr.description)
    return { sonarUrl }
  } catch (error) {
    console.error('Error fetching merge request:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch merge request')
  }
}

export async function fetchSonarIssuesAction(sonarUrl: string): Promise<string> {
  try {
    return await fetchSonarIssues(sonarUrl)
  } catch (error) {
    console.error('Error fetching SonarQube issues:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch SonarQube issues')
  }
}

export async function postIssuesToGitLab(gitlabUrl: string, sonarUrl: string, issues: string): Promise<{ success: boolean; message: string }> {
  try {
    const { projectPath, mrId } = parseGitlabUrl(gitlabUrl)
    const comment = formatGitlabIssuesComment(sonarUrl, issues)
    
    await postMergeRequestComment(projectPath, mrId, comment)
    
    return { success: true, message: 'Issues posted to GitLab successfully' }
  } catch (error) {
    console.error('Error posting to GitLab:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to post to GitLab')
  }
}

function parseGitlabUrl(url: string): { projectPath: string; mrId: string } {
  const urlObj = new URL(url)
  const pathParts = urlObj.pathname.split('/').filter(Boolean)
  const mrIndex = pathParts.indexOf('merge_requests')

  if (mrIndex === -1 || mrIndex === pathParts.length - 1) {
    throw new Error('Invalid GitLab MR URL')
  }

  const mrId = pathParts[mrIndex + 1]
  const projectPath = pathParts.slice(0, mrIndex).filter(part => part !== '-').join('/')

  return { projectPath, mrId }
}
