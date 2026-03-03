import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'info',
    message: 'Telegram bot runs as a separate process. Use: npm run dev:bot'
  })
}

export async function POST() {
  return GET()
}
