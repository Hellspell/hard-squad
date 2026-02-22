import type { FastifyInstance } from 'fastify'
import { db } from '../db'
import { authMiddleware } from '../middleware/auth'

export async function usersRoutes(app: FastifyInstance) {
  // POST /api/users/auth — авторизация через Telegram WebApp
  app.post('/auth', { preHandler: authMiddleware }, async (req, reply) => {
    const { id, first_name, last_name, username } = req.telegramUser
    const name = [first_name, last_name].filter(Boolean).join(' ')

    const { data, error } = await db
      .from('users')
      .upsert({ id, name, username }, { onConflict: 'id' })
      .select()
      .single()

    if (error) return reply.status(500).send({ message: error.message })

    return { user: data }
  })

  // GET /api/users/me — профиль текущего пользователя
  app.get('/me', { preHandler: authMiddleware }, async (req, reply) => {
    const { id } = req.telegramUser

    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return reply.status(404).send({ message: 'Пользователь не найден' })

    return data
  })
}
