require('dotenv').config()
const { Bot } = require('grammy')
const fetch = require('node-fetch')

console.log('[bot-server] Starting Telegram bot...')

const bot = new Bot(process.env.BOT_TOKEN || '')

bot.command('start', (ctx) => {
  ctx.reply('Привет! Отправьте MR ID (например: 12767), и я получу SonarQube issues и отправлю их в GitLab.')
})

bot.command('help', (ctx) => {
  ctx.reply('Использование: просто отправьте MR ID (например: 12767)')
})

bot.on('message:text', async (ctx) => {
  if (!ctx.message?.text) return
  const mrId = ctx.message.text.trim()
  
  if (!/^\d+$/.test(mrId)) {
    ctx.reply('Пожалуйста, введите корректный MR ID (только цифры)')
    return
  }

  await processMrId(ctx, mrId)
})

async function processMrId(ctx, mrId) {
  try {
    ctx.reply(`🔍 Получаю SonarQube issues для MR #${mrId}...`)
    
    const response = await fetch(`http://localhost:3003/api/sonar/${mrId}`)
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch issues')
    }
    
    const { count } = result.data
    
    ctx.reply(`✅ Успешно! Найдено ${count} issues, отправлено в GitLab.`)
    
  } catch (error) {
    console.error('Error processing MR ID:', error)
    ctx.reply(`❌ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
  }
}

bot.start()
console.log('[bot-server] Telegram bot started successfully!')
