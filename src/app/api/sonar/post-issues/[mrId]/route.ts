import { NextResponse } from 'next/server'
import {
  fetchMergeRequestDetails,
  fetchSonarIssuesAction,
  postIssuesToGitLab
} from '@/actions/sonar-actions'

async function handler(
  request: Request,
  { params }: { params: Promise<{ mrId: string }> }
) {
  console.log('[post-issues] Route hit')

  try {
    const { mrId } = await params

    if (!/^\d+$/.test(mrId)) {
      return NextResponse.json(
        { success: false, message: 'Неверный MR ID. Должен быть числом.' },
        { status: 400 }
      )
    }

    const gitlabUrl = `${process.env.GITLAB_URL}/${process.env.GITLAB_PROJECT}/implementation/-/merge_requests/${mrId}`

    const { sonarUrl: mrSonarUrl } = await fetchMergeRequestDetails(gitlabUrl)

    const sonarUrl = mrSonarUrl || `${process.env.SONAR_URL}/component_measures?id=${process.env.SONAR_PROJECT}&pullRequest=${mrId}&issueStatuses=OPEN`

    const issues = await fetchSonarIssuesAction(sonarUrl)

    await postIssuesToGitLab(gitlabUrl, sonarUrl, issues)

    const countMatch = issues.match(/Total Issues: (\d+)/)
    const count = countMatch ? parseInt(countMatch[1]) : 0

    return NextResponse.json({
      success: true,
      message: 'Issues получены из SonarQube и отправлены в GitLab',
      data: {
        issues,
        count,
        sonarUrl,
        gitlabUrl
      }
    })
  } catch (error) {
    console.error('Error in /api/sonar/post-issues/[mrId]:', error)

    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'

    let status = 500
    if (errorMessage.includes('Failed to fetch merge request')) {
      status = 404
    } else if (errorMessage.includes('Invalid MR ID')) {
      status = 400
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status }
    )
  }
}

export const GET = handler
export const POST = handler
