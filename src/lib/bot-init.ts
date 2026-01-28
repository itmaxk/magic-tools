import { bot } from '@/bot/telegram-bot'

console.log('[bot-init] Module loaded')

async function initializeBot() {
  if (!process.env.BOT_TOKEN) {
    console.log('[bot-init] BOT_TOKEN is not set, skipping Telegram bot initialization')
    return
  }
  
  try {
    console.log('[bot-init] Initializing Telegram bot...')
    await bot.start()
    console.log('[bot-init] Telegram bot initialized successfully')
  } catch (error) {
    console.error('[bot-init] Error initializing Telegram bot:', error)
  }
}

setTimeout(() => {
  console.log('[bot-init] Calling initializeBot()')
  initializeBot()
}, 2000)

export { initializeBot }