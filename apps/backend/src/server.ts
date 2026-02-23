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
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })

  // Роуты
  app.register(usersRoutes, { prefix: '/api/users' })
  app.register(squadsRoutes, { prefix: '/api/squads' })
  app.register(tasksRoutes, { prefix: '/api/tasks' })

  // Health check
  app.get('/health', () => ({ ok: true, env: process.env.NODE_ENV, v: 2 }))

  // Webhook маршрут — всегда регистрируем
  app.post('/webhook', async (req, reply) => {
    await bot.handleUpdate(req.body as Parameters<typeof bot.handleUpdate>[0])
    reply.status(200).send()
  })

  const port = Number(process.env.PORT ?? 3000)
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`Server running on port ${port}`)

  // Telegram Bot — запускаем после старта сервера
  const token = process.env.BOT_TOKEN
  const isRealToken = token && token !== 'dev_placeholder'

  if (isRealToken) {
    setupCommands(bot)
    setupScheduler(bot)

    const isProduction = process.env.NODE_ENV !== 'development'
    if (isProduction) {
      const webhookUrl = `${process.env.WEBHOOK_URL ?? 'https://hard-squadbackend-production.up.railway.app'}/webhook`
      await bot.telegram.setWebhook(webhookUrl)
      console.log(`Bot webhook set: ${webhookUrl}`)
    } else {
      bot.launch()
      console.log('Bot started (long polling)')
    }
  } else {
    console.log('⚠️  Bot disabled — set BOT_TOKEN in env')
  }
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
