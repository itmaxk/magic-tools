import { NextResponse } from 'next/server'
import { bot } from '@/bot/telegram-bot'

export async function GET() {
  try {
    if (!process.env.BOT_TOKEN) {
      return NextResponse.json({ 
        status: 'error',
        message: 'BOT_TOKEN is not configured' 
      }, { status: 400 })
    }
    
    await bot.start()
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Telegram bot started successfully' 
    })
  } catch (error) {
    console.error('Error starting Telegram bot:', error)
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to start bot' 
    }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}
