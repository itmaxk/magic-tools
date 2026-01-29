import { NextResponse } from 'next/server'
import {
  fetchMergeRequestDetails,
  fetchSonarIssuesAction,
  postIssuesToGitLab
} from '@/actions/sonar-actions'

export async function GET(
  request: Request,
  { params }: { params: { mrId: string } }
) {
  try {
    const mrId = params.mrId
    
    if (!/^\d+$/.test(mrId)) {
      return NextResponse.json(
        { success: false, message: 'Неверный MR ID. Должен быть числом.' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('dryRun') === 'true'

    const gitlabUrl = `${process.env.GITLAB_URL}/${process.env.GITLAB_PROJECT}/implementation/-/merge_requests/${mrId}`

    const { sonarUrl: mrSonarUrl } = await fetchMergeRequestDetails(gitlabUrl)

    const sonarUrl = mrSonarUrl || `${process.env.SONAR_URL}/component_measures?id=${process.env.SONAR_PROJECT}&pullRequest=${mrId}&issueStatuses=OPEN`

    const issues = await fetchSonarIssuesAction(sonarUrl)

    if (!dryRun) {
      await postIssuesToGitLab(gitlabUrl, sonarUrl, issues)
    }

    const countMatch = issues.match(/Total Issues: (\d+)/)
    const count = countMatch ? parseInt(countMatch[1]) : 0

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? 'Issues успешно получены (тестовый режим, без отправки в GitLab)' 
        : 'Issues успешно получены и отправлены в GitLab',
      data: {
        issues,
        count,
        sonarUrl,
        gitlabUrl,
        dryRun
      }
    })

  } catch (error) {
    console.error('Error in /api/sonar/[mrId]:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
    
    let status = 500
    if (errorMessage.includes('Failed to fetch merge request')) {
      status = 404
    } else if (errorMessage.includes('Invalid MR ID')) {
      status = 400
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage 
      },
      { status }
    )
  }
}
