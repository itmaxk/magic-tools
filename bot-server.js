require('dotenv').config()
const { Bot } = require('grammy')
const fetch = require('node-fetch')

console.log('[bot-server] Starting Telegram bot...')

const bot = new Bot(process.env.BOT_TOKEN || '')

const pendingOperations = new Map()

function setOperationTimeout(chatId) {
  const operation = pendingOperations.get(chatId)
  if (!operation) return
  
  operation.timeoutTimer = setTimeout(() => {
    cancelOperation(chatId, '⏱️ Время истекло. Пожалуйста, введите MR ID снова.')
  }, 30000)
}

function cancelOperation(chatId, message) {
  const operation = pendingOperations.get(chatId)
  if (!operation) return
  
  if (operation.timeoutTimer) {
    clearTimeout(operation.timeoutTimer)
  }
  
  pendingOperations.delete(chatId)
  return message
}

function validatePassword(input) {
  return input === process.env.BOT_PASS
}

bot.command('start', (ctx) => {
  cancelOperation(ctx.chat.id, null)
  ctx.reply('Привет! Отправьте MR ID (например: 12767), и я получу SonarQube issues и отправлю их в GitLab.')
})

bot.command('help', (ctx) => {
  ctx.reply('Использование: просто отправьте MR ID (например: 12767)\n\nКоманды:\n/start - Перезапустить бота\n/cancel - Отменить текущую операцию\n/help - Показать справку')
})

bot.command('cancel', (ctx) => {
  const message = cancelOperation(ctx.chat.id, '❌ Операция отменена.')
  if (message) ctx.reply(message)
})

bot.on('message:text', async (ctx) => {
  if (!ctx.message?.text) return
  const text = ctx.message.text.trim()
  
  if (text.toLowerCase() === 'cancel' || text.toLowerCase() === 'отмена') {
    const message = cancelOperation(ctx.chat.id, '❌ Операция отменена.')
    if (message) ctx.reply(message)
    return
  }
  
  const pendingOp = pendingOperations.get(ctx.chat.id)
  
  if (pendingOp) {
    await handlePasswordEntry(ctx, text)
  } else {
    await handleMrIdEntry(ctx, text)
  }
})

async function handleMrIdEntry(ctx, mrId) {
  if (!/^\d+$/.test(mrId)) {
    ctx.reply('Пожалуйста, введите корректный MR ID (только цифры)')
    return
  }
  
  if (!process.env.BOT_PASS) {
    ctx.reply('❌ Ошибка: пароль бота не настроен (BOT_PASS). Обратитесь к администратору.')
    return
  }
  
  pendingOperations.set(ctx.chat.id, {
    mrId,
    attempts: 0,
    startTime: Date.now(),
    timeoutTimer: null
  })
  
  setOperationTimeout(ctx.chat.id)
  
  ctx.reply(`🔐 Введите пароль подтверждения для MR #${mrId}`)
}

async function handlePasswordEntry(ctx, password) {
  const operation = pendingOperations.get(ctx.chat.id)
  if (!operation) return
  
  operation.attempts++
  
  if (validatePassword(password)) {
    clearTimeout(operation.timeoutTimer)
    pendingOperations.delete(ctx.chat.id)
    
    await processMrId(ctx, operation.mrId)
  } else {
    const remaining = 3 - operation.attempts
    
    if (remaining > 0) {
      ctx.reply(`❌ Неверный пароль. Осталось попыток: ${remaining}`)
      clearTimeout(operation.timeoutTimer)
      setOperationTimeout(ctx.chat.id)
    } else {
      cancelOperation(ctx.chat.id, '❌ Пароль неверный. Все попытки исчерпаны. Операция отменена.')
      ctx.reply('Пожалуйста, введите MR ID снова для повторной попытки.')
    }
  }
}

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
