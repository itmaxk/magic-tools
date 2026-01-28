import { bot } from '@/bot/telegram-bot'

export async function initializeBot() {
  if (!process.env.BOT_TOKEN) {
    console.log('BOT_TOKEN is not set, skipping Telegram bot initialization')
    return
  }
  
  try {
    console.log('Initializing Telegram bot...')
    await bot.start()
    console.log('Telegram bot initialized successfully')
  } catch (error) {
    console.error('Error initializing Telegram bot:', error)
  }
}
