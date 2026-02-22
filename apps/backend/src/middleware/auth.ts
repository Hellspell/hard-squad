import { createHmac } from 'crypto'
import type { FastifyRequest, FastifyReply } from 'fastify'

const BOT_TOKEN = process.env.BOT_TOKEN!

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

export function validateTelegramData(initData: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    params.delete('hash')

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest()
    const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

    if (hash !== expectedHash) return null

    const userRaw = params.get('user')
    if (!userRaw) return null

    return JSON.parse(userRaw) as TelegramUser
  } catch {
    return null
  }
}

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const initData = req.headers['x-telegram-init-data'] as string | undefined

  if (!initData) {
    return reply.status(401).send({ message: 'Нет initData' })
  }

  // В режиме разработки пропускаем валидацию
  if (process.env.NODE_ENV === 'development' && initData === 'dev') {
    req.telegramUser = { id: 1, first_name: 'Dev', username: 'dev' }
    return
  }

  const user = validateTelegramData(initData)
  if (!user) {
    return reply.status(401).send({ message: 'Невалидные данные Telegram' })
  }

  req.telegramUser = user
}

// Расширяем типы Fastify
declare module 'fastify' {
  interface FastifyRequest {
    telegramUser: TelegramUser
  }
}
