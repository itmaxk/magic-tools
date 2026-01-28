import { NextResponse } from 'next/server'

export async function GET() {
  const gitlabUrl = process.env.GITLAB_URL
  const gitlabProject = process.env.GITLAB_PROJECT
  const sonarUrl = process.env.SONAR_URL
  const sonarProject = process.env.SONAR_PROJECT

  return NextResponse.json({
    gitlabUrl,
    gitlabProject,
    sonarUrl,
    sonarProject
  })
}
