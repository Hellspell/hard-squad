import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Telegraf } from 'telegraf'
import { usersRoutes } from './routes/users'
import { squadsRoutes } from './routes/squads'
import { tasksRoutes } from './routes/tasks'
import { setupCommands } from './bot/commands'
import { setupScheduler } from './bot/scheduler'

const app = Fastify({ logger: true })
const bot = new Telegraf(process.env.BOT_TOKEN!)

async function start() {
  // CORS — разрешаем только наш frontend
  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })

  // Роуты
  app.register(usersRoutes, { prefix: '/api/users' })
  app.register(squadsRoutes, { prefix: '/api/squads' })
  app.register(tasksRoutes, { prefix: '/api/tasks' })

  // Health check
  app.get('/health', () => ({ ok: true }))

  // Telegram Bot — запускаем только с реальным токеном
  const isDev = process.env.NODE_ENV === 'development'
  const hasRealToken = process.env.BOT_TOKEN && process.env.BOT_TOKEN !== 'dev_placeholder'

  if (hasRealToken) {
    setupCommands(bot)
    setupScheduler(bot)

    const webhookBase = process.env.WEBHOOK_URL
      ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null)

    if (webhookBase) {
      const webhookUrl = `${webhookBase}/webhook`
      await bot.telegram.setWebhook(webhookUrl)
      app.post('/webhook', (req, reply) => {
        bot.handleUpdate(req.body as Parameters<typeof bot.handleUpdate>[0])
        reply.status(200).send()
      })
      console.log(`Bot webhook: ${webhookUrl}`)
    } else {
      bot.launch()
      console.log('Bot started (long polling)')
    }
  } else if (isDev) {
    console.log('⚠️  Bot отключён — добавь реальный BOT_TOKEN в .env')
  }

  const port = Number(process.env.PORT ?? 3000)
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`Server running on port ${port}`)
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
