export interface SonarIssue {
  key: string
  rule: string
  severity: string
  component: string
  line?: number
  message: string
  status: string
}

export interface SonarIssuesResponse {
  issues: SonarIssue[]
  total: number
  paging: {
    pageIndex: number
    pageSize: number
    total: number
  }
}

export function parseSonarUrl(url: string): {
  projectKey: string
  pullRequest: string
  issueStatuses: string
} {
  const urlObj = new URL(url)
  const projectKey = urlObj.searchParams.get('id')
  const pullRequest = urlObj.searchParams.get('pullRequest')
  const issueStatuses = urlObj.searchParams.get('issueStatuses') || 'OPEN'

  if (!projectKey || !pullRequest) {
    throw new Error('Invalid SonarQube URL. Must contain "id" and "pullRequest" parameters.')
  }

  return { projectKey, pullRequest, issueStatuses }
}

export async function getIssues(
  projectKey: string,
  pullRequest: string,
  issueStatuses: string
): Promise<SonarIssuesResponse> {
  const apiUrl = new URL(`${process.env.SONAR_URL}/api/issues/search`)
  apiUrl.searchParams.append('id', projectKey)
  apiUrl.searchParams.append('pullRequest', pullRequest)
  
  issueStatuses = issueStatuses === 'OPEN' ? 'OPEN' : issueStatuses
  apiUrl.searchParams.append('issueStatuses', issueStatuses)
  apiUrl.searchParams.append('ps', '100')
  
  console.log('Fetching SonarQube issues:', apiUrl.toString())

  const response = await fetch(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.SONAR_TOKEN || ''}`,
    },
  })

  if (!response.ok) {
    console.error('SonarQube API error:', response.status, response.statusText)
    throw new Error(`Failed to fetch SonarQube issues: ${response.statusText}`)
  }

  const data = await response.json()
  console.log('SonarQube response:', JSON.stringify({ total: data.total, paging: data.paging }, null, 2))
  
  return data
}

export function formatIssues(issues: SonarIssue[], total: number): string {
  if (issues.length === 0) {
    return 'No issues found.'
  }

  const severityOrder = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO']
  
  const sortedIssues = [...issues].sort((a, b) => {
    return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  })

  const groupedBySeverity = sortedIssues.reduce((acc, issue) => {
    if (!acc[issue.severity]) {
      acc[issue.severity] = []
    }
    acc[issue.severity].push(issue)
    return acc
  }, {} as Record<string, SonarIssue[]>)

  let result = `Total Issues: ${total}\n\n`

  for (const severity of severityOrder) {
    const severityIssues = groupedBySeverity[severity]
    if (!severityIssues || severityIssues.length === 0) continue

    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    result += `${severity} (${severityIssues.length} issues)\n`
    result += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    for (const issue of severityIssues) {
      result += `📍 ${issue.component}${issue.line ? `:${issue.line}` : ''}\n`
      result += `   Message: ${issue.message}\n`
      result += `   Status: ${issue.status}\n\n`
    }
  }

  return result
}

export async function fetchSonarIssues(sonarUrl: string): Promise<string> {
  const { projectKey, pullRequest, issueStatuses } = parseSonarUrl(sonarUrl)
  const response = await getIssues(projectKey, pullRequest, issueStatuses)
  return formatIssues(response.issues, response.total)
}
