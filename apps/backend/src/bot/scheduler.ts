import cron from 'node-cron'
import { Telegraf } from 'telegraf'
import { db } from '../db'

export function setupScheduler(bot: Telegraf) {
  // 09:00 — утреннее уведомление всем активным пользователям
  cron.schedule('0 9 * * *', () => sendMorningReminder(bot), { timezone: 'Europe/Moscow' })

  // 21:00 — вечернее уведомление (осталось 3 часа)
  cron.schedule('0 21 * * *', () => sendEveningReminder(bot), { timezone: 'Europe/Moscow' })

  // 23:00 — итог дня в squad-чаты
  cron.schedule('0 23 * * *', () => sendDailyReport(bot), { timezone: 'Europe/Moscow' })

  // 00:01 — обновление streak
  cron.schedule('1 0 * * *', () => updateStreaks(), { timezone: 'Europe/Moscow' })
}

async function sendMorningReminder(bot: Telegraf) {
  const { data: users } = await db.from('users').select('id, streak')
  if (!users) return

  for (const user of users) {
    try {
      await bot.telegram.sendMessage(
        user.id,
        `🌅 Новый день — новые 3 задачи.\n\n🔥 Streak: ${user.streak} дней`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: 'Добавить задачи', web_app: { url: process.env.FRONTEND_URL! } },
            ]],
          },
        }
      )
    } catch {
      // Пользователь заблокировал бота — пропускаем
    }
  }
}

async function sendEveningReminder(bot: Telegraf) {
  const today = new Date().toISOString().split('T')[0]

  const { data: users } = await db.from('users').select('id, streak')
  if (!users) return

  for (const user of users) {
    try {
      // Считаем незавершённые задачи
      const { data: daily } = await db
        .from('daily_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (!daily) {
        await bot.telegram.sendMessage(
          user.id,
          `⏰ До конца дня 3 часа.\nЗадачи ещё не добавлены. Streak под угрозой! 🔥${user.streak}`,
          {
            reply_markup: {
              inline_keyboard: [[
                { text: 'Открыть', web_app: { url: process.env.FRONTEND_URL! } },
              ]],
            },
          }
        )
        continue
      }

      const { data: tasks } = await db
        .from('tasks')
        .select('is_done')
        .eq('daily_id', daily.id)

      const done = tasks?.filter(t => t.is_done).length ?? 0
      const total = tasks?.length ?? 0
      const left = total - done

      if (left > 0) {
        await bot.telegram.sendMessage(
          user.id,
          `⏰ До конца дня 3 часа.\nОсталось ${left} из ${total} задач. Streak: 🔥${user.streak}`,
          {
            reply_markup: {
              inline_keyboard: [[
                { text: 'Открыть', web_app: { url: process.env.FRONTEND_URL! } },
              ]],
            },
          }
        )
      }
    } catch {
      // ignore
    }
  }
}

async function sendDailyReport(bot: Telegraf) {
  const today = new Date().toISOString().split('T')[0]

  // Получаем все squad с chat_id
  const { data: squads } = await db.from('squads').select('id, name, chat_id').not('chat_id', 'is', null)
  if (!squads) return

  for (const squad of squads) {
    try {
      const { data: members } = await db
        .from('squad_members')
        .select('user_id, users(name)')
        .eq('squad_id', squad.id)

      if (!members?.length) continue

      const lines: string[] = [`📊 Итог дня — ${squad.name}:\n`]

      for (const m of members) {
        const user = m.users as { name: string }
        const { data: daily } = await db
          .from('daily_tasks')
          .select('id')
          .eq('user_id', m.user_id)
          .eq('squad_id', squad.id)
          .eq('date', today)
          .single()

        if (!daily) {
          lines.push(`⬜ ${user.name} — не добавил задачи`)
          continue
        }

        const { data: tasks } = await db.from('tasks').select('is_done').eq('daily_id', daily.id)
        const done = tasks?.filter(t => t.is_done).length ?? 0
        const total = tasks?.length ?? 0
        const icon = done === total ? '✅' : done > 0 ? '🟡' : '❌'
        lines.push(`${icon} ${user.name} — ${done}/${total}`)
      }

      await bot.telegram.sendMessage(squad.chat_id!, lines.join('\n'))
    } catch {
      // ignore
    }
  }
}

async function updateStreaks() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const { data: users } = await db.from('users').select('id, streak, best_streak')
  if (!users) return

  for (const user of users) {
    // Проверяем вчерашний день
    const { data: daily } = await db
      .from('daily_tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', yesterdayStr)
      .single()

    if (!daily) {
      // Не добавил задачи вчера → обнуление
      await db.from('users').update({ streak: 0 }).eq('id', user.id)
      continue
    }

    const { data: tasks } = await db.from('tasks').select('is_done').eq('daily_id', daily.id)
    const allDone = tasks?.every(t => t.is_done) && (tasks?.length ?? 0) > 0

    if (allDone) {
      const newStreak = user.streak + 1
      const newBest = Math.max(newStreak, user.best_streak)
      await db.from('users').update({ streak: newStreak, best_streak: newBest }).eq('id', user.id)
    } else {
      await db.from('users').update({ streak: 0 }).eq('id', user.id)
    }
  }
}
