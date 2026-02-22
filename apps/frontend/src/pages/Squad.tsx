import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSquadToday } from '../api'
import type { SquadToday } from '../api'
import { tg } from '../App'

export default function Squad() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<SquadToday | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tg?.BackButton.show()
    tg?.BackButton.onClick(() => navigate('/home'))

    if (id) {
      getSquadToday(id)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false))
    }

    return () => tg?.BackButton.hide()
  }, [id, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen p-4 gap-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold">Сегодня</h1>
        <p className="text-sm text-[var(--tg-theme-hint-color)]">
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {data?.members.map(member => (
        <div
          key={member.user_id}
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >
          {/* Member header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
              >
                {member.name[0]}
              </div>
              <span className="font-semibold">{member.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--tg-theme-hint-color)]">🔥 {member.streak}</span>
              {member.total_count > 0 && (
                <span className={`text-sm font-bold ${
                  member.done_count === member.total_count ? 'text-green-500' : 'text-[var(--tg-theme-hint-color)]'
                }`}>
                  {member.done_count}/{member.total_count}
                </span>
              )}
            </div>
          </div>

          {/* Tasks */}
          {member.tasks.length === 0 ? (
            <p className="text-sm text-[var(--tg-theme-hint-color)]">Ещё не добавил задачи</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {member.tasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <span className={task.is_done ? 'text-green-500' : 'text-[var(--tg-theme-hint-color)]'}>
                    {task.is_done ? '✓' : '○'}
                  </span>
                  <span className={task.is_done ? 'line-through text-[var(--tg-theme-hint-color)]' : ''}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Invite button */}
      <button
        onClick={() => {
          const code = localStorage.getItem('hs_invite_code')
          if (code && navigator.share) {
            navigator.share({ title: 'Hard Squad', text: `Присоединяйся к моему squad!`, url: `https://t.me/hardsquad_bot?start=${code}` })
          }
        }}
        className="w-full py-4 rounded-2xl font-semibold text-base mt-auto"
        style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
      >
        Пригласить ещё
      </button>
    </div>
  )
}
