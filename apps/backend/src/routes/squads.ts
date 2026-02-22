import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'crypto'
import { db } from '../db'
import { authMiddleware } from '../middleware/auth'

function generateInviteCode(): string {
  return randomBytes(3).toString('hex').toUpperCase() // напр. "A3F9B2"
}

export async function squadsRoutes(app: FastifyInstance) {
  // GET /api/squads/:code — инфо о squad по инвайт-коду
  app.get<{ Params: { code: string } }>('/:code', async (req, reply) => {
    const { code } = req.params

    const { data, error } = await db
      .from('squads')
      .select('*, squad_members(user_id, users(name, streak))')
      .eq('invite_code', code)
      .single()

    if (error || !data) return reply.status(404).send({ message: 'Squad не найден' })

    return formatSquad(data)
  })

  // POST /api/squads — создать squad
  app.post<{ Body: { name: string } }>(
    '/',
    { preHandler: authMiddleware },
    async (req, reply) => {
      const { name } = req.body
      const { id: userId } = req.telegramUser

      if (!name?.trim()) return reply.status(400).send({ message: 'Нужно название' })

      const invite_code = generateInviteCode()

      const { data: squad, error } = await db
        .from('squads')
        .insert({ name: name.trim(), invite_code, created_by: userId })
        .select()
        .single()

      if (error) return reply.status(500).send({ message: error.message })

      // Добавляем создателя в squad
      await db.from('squad_members').insert({ squad_id: squad.id, user_id: userId })

      return { ...squad, members: [] }
    }
  )

  // POST /api/squads/:id/join — вступить в squad
  app.post<{ Params: { id: string } }>(
    '/:id/join',
    { preHandler: authMiddleware },
    async (req, reply) => {
      const { id: squadId } = req.params
      const { id: userId } = req.telegramUser

      // Проверяем что squad существует
      const { data: squad, error: squadErr } = await db
        .from('squads')
        .select('id')
        .eq('id', squadId)
        .single()

      if (squadErr || !squad) return reply.status(404).send({ message: 'Squad не найден' })

      // Проверяем что ещё не в squad
      const { data: existing } = await db
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', squadId)
        .eq('user_id', userId)
        .single()

      if (existing) return reply.status(200).send({ message: 'Уже в squad' })

      // Проверяем лимит (max 5 участников)
      const { count } = await db
        .from('squad_members')
        .select('*', { count: 'exact', head: true })
        .eq('squad_id', squadId)

      if ((count ?? 0) >= 5) return reply.status(400).send({ message: 'Squad заполнен (max 5)' })

      await db.from('squad_members').insert({ squad_id: squadId, user_id: userId })

      return { message: 'Вступил в squad' }
    }
  )

  // GET /api/squads/:id/today — статус всех участников на сегодня
  app.get<{ Params: { id: string } }>(
    '/:id/today',
    { preHandler: authMiddleware },
    async (req, reply) => {
      const { id: squadId } = req.params
      const today = new Date().toISOString().split('T')[0]

      // Получаем всех участников
      const { data: members, error } = await db
        .from('squad_members')
        .select('user_id, users(id, name, streak)')
        .eq('squad_id', squadId)

      if (error) return reply.status(500).send({ message: error.message })

      // Получаем задачи на сегодня для всех участников
      const { data: dailyTasks } = await db
        .from('daily_tasks')
        .select('*, tasks(*)')
        .eq('squad_id', squadId)
        .eq('date', today)

      const result = members?.map(m => {
        const user = m.users as { id: number; name: string; streak: number }
        const daily = dailyTasks?.find(d => d.user_id === m.user_id)
        const tasks = (daily?.tasks ?? []).sort((a: { position: number }, b: { position: number }) => a.position - b.position)

        return {
          user_id: m.user_id,
          name: user.name,
          streak: user.streak,
          tasks,
          done_count: tasks.filter((t: { is_done: boolean }) => t.is_done).length,
          total_count: tasks.length,
        }
      }) ?? []

      return { squad_id: squadId, date: today, members: result }
    }
  )
}

function formatSquad(data: Record<string, unknown>) {
  return {
    id: data.id,
    name: data.name,
    invite_code: data.invite_code,
    members: (data.squad_members as Array<{ user_id: number; users: { name: string; streak: number } }>)?.map(m => ({
      user_id: m.user_id,
      name: m.users?.name,
      streak: m.users?.streak ?? 0,
    })) ?? [],
  }
}
