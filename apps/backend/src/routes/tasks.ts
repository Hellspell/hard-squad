import type { FastifyInstance } from 'fastify'
import { db } from '../db'
import { authMiddleware } from '../middleware/auth'

export async function tasksRoutes(app: FastifyInstance) {
  // POST /api/tasks — добавить задачи на день
  app.post<{ Body: { squad_id: string; tasks: string[] } }>(
    '/',
    { preHandler: authMiddleware },
    async (req, reply) => {
      const { squad_id, tasks } = req.body
      const { id: userId } = req.telegramUser
      const today = new Date().toISOString().split('T')[0]

      if (!squad_id) return reply.status(400).send({ message: 'squad_id обязателен' })
      if (!tasks?.length || tasks.length > 3) return reply.status(400).send({ message: 'От 1 до 3 задач' })

      // Создаём или обновляем запись на сегодня
      const { data: daily, error: dailyErr } = await db
        .from('daily_tasks')
        .upsert({ user_id: userId, squad_id, date: today }, { onConflict: 'user_id,squad_id,date' })
        .select()
        .single()

      if (dailyErr) return reply.status(500).send({ message: dailyErr.message })

      // Удаляем старые задачи (если перезаписываем)
      await db.from('tasks').delete().eq('daily_id', daily.id)

      // Вставляем новые задачи
      const taskRows = tasks.map((text, i) => ({
        daily_id: daily.id,
        text: text.trim(),
        position: i + 1,
        is_done: false,
      }))

      const { data: createdTasks, error: tasksErr } = await db
        .from('tasks')
        .insert(taskRows)
        .select()

      if (tasksErr) return reply.status(500).send({ message: tasksErr.message })

      return { ...daily, tasks: createdTasks }
    }
  )

  // PATCH /api/tasks/:id/done — отметить задачу выполненной
  app.patch<{ Params: { id: string } }>(
    '/:id/done',
    { preHandler: authMiddleware },
    async (req, reply) => {
      const { id: taskId } = req.params
      const { id: userId } = req.telegramUser

      // Проверяем что задача принадлежит этому пользователю
      const { data: task, error: fetchErr } = await db
        .from('tasks')
        .select('*, daily_tasks(user_id)')
        .eq('id', taskId)
        .single()

      if (fetchErr || !task) return reply.status(404).send({ message: 'Задача не найдена' })

      const dailyUserId = (task.daily_tasks as { user_id: number })?.user_id
      if (dailyUserId !== userId) return reply.status(403).send({ message: 'Чужая задача' })

      const { data: updated, error: updateErr } = await db
        .from('tasks')
        .update({ is_done: true })
        .eq('id', taskId)
        .select()
        .single()

      if (updateErr) return reply.status(500).send({ message: updateErr.message })

      return updated
    }
  )
}
