const { Bot, GrammyError, HttpError } = require('grammy')
import type { Context } from 'grammy'

const bot = new Bot(process.env.BOT_TOKEN)

bot.command('start', (ctx: Context) => {
  ctx.reply('Привет! Отправьте MR ID (например: 12767), и я получу SonarQube issues и отправлю их в GitLab.')
})

bot.command('help', (ctx: Context) => {
  ctx.reply('Использование: просто отправьте MR ID (например: 12767)')
})

bot.on('message:text', async (ctx: Context) => {
  if (!ctx.message?.text) return
  const mrId = ctx.message.text.trim()
  
  if (!/^\d+$/.test(mrId)) {
    ctx.reply('Пожалуйста, введите корректный MR ID (только цифры)')
    return
  }

  await processMrId(ctx, mrId)
})

async function processMrId(ctx: Context, mrId: string) {
  try {
    const config = await fetch('http://localhost:3001/api/urls').then(r => r.json())
    
    const gitlabUrl = `${config.gitlabUrl}/${config.gitlabProject}/implementation/-/merge_requests/${mrId}`
    
    ctx.reply(`🔍 Получаю SonarQube issues для MR #${mrId}...`)
    
    const { sonarUrl } = await fetchMergeRequestDetails(gitlabUrl)
    
    const finalSonarUrl = sonarUrl || `${config.sonarUrl}/component_measures?id=${config.sonarProject}&pullRequest=${mrId}&issueStatuses=OPEN`
    
    const issues = await fetchSonarIssuesAction(finalSonarUrl)
    
    const issuesData = JSON.parse(issues)
    const issueCount = issuesData.issues?.length || 0
    
    const hasGitlabConnection = !!(process.env.GITLAB_TOKEN && process.env.GITLAB_TOKEN.length > 0)
    
    if (hasGitlabConnection) {
      await postIssuesToGitLab(gitlabUrl, finalSonarUrl, issues)
      ctx.reply(`✅ Успешно! Найдено ${issueCount} issues, отправлено в GitLab.`)
    } else {
      ctx.reply(`✅ Успешно! Найдено ${issueCount} issues.`)
    }
    
  } catch (error) {
    console.error('Error processing MR ID:', error)
    ctx.reply(`❌ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
  }
}

async function fetchMergeRequestDetails(gitlabUrl: string) {
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
  
  const mr = await response.json()
  const sonarUrl = extractSonarLink(mr.description)
  return { sonarUrl }
}

function parseGitlabUrl(url: string) {
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

function extractSonarLink(description: string | null): string | null {
  if (!description) return null
  
  const patterns = [
    /See analysis details on (SonarQube|Sonar)[\s\S]*?(https?:\/\/[^\s\)]+)/i,
    /SonarQube[\s\S]*?(https?:\/\/[^\s\)]+)/i,
    /Analysis[\s\S]*?(https?:\/\/[^\s\)]+component_measures[^\s\)]*)/i
  ]
  
  for (const pattern of patterns) {
    const match = description.match(pattern)
    if (match && match[2]) {
      return match[2]
    }
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

async function fetchSonarIssuesAction(sonarUrl: string) {
  const urlObj = new URL(sonarUrl)
  const componentId = urlObj.searchParams.get('id')
  const pullRequest = urlObj.searchParams.get('pullRequest')
  
  const apiUrl = `${process.env.SONAR_URL}/api/issues/search?componentKeys=${componentId}&pullRequest=${pullRequest}&issueStatuses=OPEN&ps=500`
  
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${process.env.SONAR_TOKEN}`
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch SonarQube issues: ${response.statusText}`)
  }
  
  return await response.text()
}

async function postIssuesToGitLab(gitlabUrl: string, sonarUrl: string, issues: string) {
  const { projectPath, mrId } = parseGitlabUrl(gitlabUrl)
  
  const comment = formatGitlabIssuesComment(sonarUrl, issues)
  
  const response = await fetch(
    `${process.env.GITLAB_URL}/api/v4/projects/${encodeURIComponent(projectPath)}/merge_requests/${mrId}/notes`,
    {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': process.env.GITLAB_TOKEN || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: comment
      })
    }
  )
  
  if (!response.ok) {
    throw new Error(`Failed to post to GitLab: ${response.statusText}`)
  }
}

function formatGitlabIssuesComment(sonarUrl: string, issues: string) {
  const issuesData = JSON.parse(issues)
  const issuesList = issuesData.issues || []
  
  interface Issue {
    severity: string
    rule: string
    message: string
  }
  
  const issuesBySeverity: Record<string, Issue[]> = {
    BLOCKER: [],
    CRITICAL: [],
    MAJOR: [],
    MINOR: [],
    INFO: []
  }
  
  issuesList.forEach((issue: Issue) => {
    const severity = issue.severity
    if (issuesBySeverity[severity]) {
      issuesBySeverity[severity].push(issue)
    }
  })
  
  let comment = `### 📊 SonarQube Issues Report\n\n`
  comment += `[View in SonarQube](${sonarUrl})\n\n`
  
  comment += `#### Summary\n`
  comment += `- Total Issues: **${issuesList.length}**\n`
  comment += `- **BLOCKER**: ${issuesBySeverity.BLOCKER.length}\n`
  comment += `- **CRITICAL**: ${issuesBySeverity.CRITICAL.length}\n`
  comment += `- **MAJOR**: ${issuesBySeverity.MAJOR.length}\n`
  comment += `- **MINOR**: ${issuesBySeverity.MINOR.length}\n`
  comment += `- **INFO**: ${issuesBySeverity.INFO.length}\n\n`
  
  if (issuesBySeverity.BLOCKER.length > 0 || issuesBySeverity.CRITICAL.length > 0) {
    comment += `#### 🔴 Critical Issues\n`
    
    if (issuesBySeverity.BLOCKER.length > 0) {
      comment += `**BLOCKER:**\n`
      issuesBySeverity.BLOCKER.slice(0, 5).forEach((issue: Issue) => {
        comment += `- \`${issue.rule}\`: ${issue.message.substring(0, 100)}...\n`
      })
      if (issuesBySeverity.BLOCKER.length > 5) {
        comment += `- ...and ${issuesBySeverity.BLOCKER.length - 5} more\n`
      }
    }
    
    if (issuesBySeverity.CRITICAL.length > 0) {
      comment += `**CRITICAL:**\n`
      issuesBySeverity.CRITICAL.slice(0, 5).forEach((issue: Issue) => {
        comment += `- \`${issue.rule}\`: ${issue.message.substring(0, 100)}...\n`
      })
      if (issuesBySeverity.CRITICAL.length > 5) {
        comment += `- ...and ${issuesBySeverity.CRITICAL.length - 5} more\n`
      }
    }
  }
  
  return comment
}

export { bot }
