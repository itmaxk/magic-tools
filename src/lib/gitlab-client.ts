export interface GitLabMergeRequest {
  id: number
  iid: number
  title: string
  description: string
  web_url: string
  project_id: number
}

export interface GitLabComment {
  id: number
  body: string
  created_at: string
}

export function parseGitlabUrl(url: string): { projectPath: string; mrId: string } {
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

export async function getMergeRequest(gitlabUrl: string): Promise<GitLabMergeRequest> {
  const { projectPath, mrId } = parseGitlabUrl(gitlabUrl)

  const response = await fetch(
    `${process.env.GITLAB_URL}/api/v4/projects/${encodeURIComponent(projectPath)}/merge_requests/${mrId}`,
    {
      headers: {
        'PRIVATE-TOKEN': process.env.GITLAB_TOKEN || '',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch merge request: ${response.statusText}`)
  }

  return await response.json()
}

export function extractSonarLink(description: string): string | null {
  const patterns = [
    /See analysis details on SonarQube.*?\[([^\]]+)\]\(([^)]+)\)/,
    /See analysis details on SonarQube.*?(https?:\/\/[^\s]+)/,
    /\[View analysis on SonarQube\]\(([^)]+)\)/,
  ]

  for (const pattern of patterns) {
    const match = description.match(pattern)
    if (match) {
      return match[2] || match[1] || match[0]
    }
  }

  const urlPattern = /(https?:\/\/[^\s]+\.(?:sonarqube|sonarcloud|qube|magic)\.com[^\s]*)/i
  const urlMatch = description.match(urlPattern)
  if (urlMatch) {
    return urlMatch[0]
  }

  return null
}

export function formatGitlabIssuesComment(sonarUrl: string, issues: string): string {
  return `## 🔍 SonarQube Analysis Results

[View Analysis on SonarQube](${sonarUrl})

### Issues Found

\`\`\`
${issues}
\`\`\`
`
}

export function formatGitlabAIFixesComment(aiFixes: string): string {
  return `## 💡Предложения по исправлению валидаций SonarCube (необходима проверка):

\`\`\`
${aiFixes}
\`\`\`
`
}

export async function postMergeRequestComment(
  projectPath: string,
  mrId: string,
  comment: string
): Promise<GitLabComment> {
  const response = await fetch(
    `${process.env.GITLAB_URL}/api/v4/projects/${encodeURIComponent(projectPath)}/merge_requests/${mrId}/notes`,
    {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': process.env.GITLAB_TOKEN || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: comment }),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to post comment: ${response.statusText}`)
  }

  return await response.json()
}
