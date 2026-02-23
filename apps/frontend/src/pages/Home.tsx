import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, addTasks, completeTask, getSquadToday } from '../api'
import type { User, MemberStatus, Task } from '../api'
import { tg } from '../App'

function streakLabel(streak: number): string {
  if (streak === 0) return 'Начни сегодня 💪'
  if (streak < 7) return 'дней подряд'
  if (streak < 30) return 'дней подряд 🔥 Отличный старт!'
  return 'дней подряд 🏆 Легенда!'
}

function timeLeft() {
  const now = new Date()
  const end = new Date()
  end.setHours(23, 59, 0, 0)
  const diffMs = Math.max(0, end.getTime() - now.getTime())
  const totalMinutes = Math.floor(diffMs / 1000 / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return { hours, minutes, isUrgent: hours < 2 }
}

function SkeletonHome() {
  return (
    <div className="flex flex-col min-h-screen p-4 gap-4">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <div className="skeleton h-14 w-28 mb-2" />
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="skeleton h-10 w-16" style={{ borderRadius: 12 }} />
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {[0, 1, 2].map(i => <div key={i} className="skeleton h-16 w-full" />)}
      </div>
      <div className="skeleton h-14 w-full" />
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [squadStatus, setSquadStatus] = useState<MemberStatus[]>([])
  const [squadId, setSquadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInput, setShowInput] = useState(false)
  const [inputText, setInputText] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  const init = useCallback(async () => {
    setError(null)
    try {
      const { user: me } = await auth()
      setUser(me)

      const savedSquadId = localStorage.getItem('hs_squad_id')
      if (savedSquadId) {
        setSquadId(savedSquadId)
        const today = await getSquadToday(savedSquadId)
        const me_status = today.members.find(m => m.user_id === me.id)
        if (me_status) setTasks(me_status.tasks)
        setSquadStatus(today.members.filter(m => m.user_id !== me.id))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { init() }, [init])

  async function handleAddTask() {
    if (!inputText.trim() || !squadId || addingTask) return
    if (tasks.length >= 3) return

    tg?.HapticFeedback.impactOccurred('light')
    setAddingTask(true)
    try {
      const daily = await addTasks(squadId, [...tasks.map(t => t.text), inputText.trim()])
      setTasks(daily.tasks)
      setInputText('')
      setShowInput(false)
    } catch {
      tg?.HapticFeedback.notificationOccurred('error')
    } finally {
      setAddingTask(false)
    }
  }

  function handleComplete(taskId: string) {
    tg?.showConfirm('Задача выполнена? Отменить будет нельзя.', async (ok) => {
      if (!ok) return
      tg?.HapticFeedback.impactOccurred('medium')
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_done: true } : t))
      try {
        const updated = await completeTask(taskId)
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t))
        tg?.HapticFeedback.notificationOccurred('success')
      } catch {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_done: false } : t))
        tg?.HapticFeedback.notificationOccurred('error')
      }
    })
  }

  if (loading) return <SkeletonHome />

  // Не в Telegram — показываем специальный экран
  if (!window.Telegram?.WebApp?.initData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4 text-center">
        <span style={{ fontSize: 64 }}>✈️</span>
        <div>
          <p className="font-heading font-bold" style={{ fontSize: 20 }}>Открой в Telegram</p>
          <p className="text-sm mt-2" style={{ color: 'var(--tg-theme-hint-color)', maxWidth: 260, margin: '8px auto 0' }}>
            Hard Squad работает только как Telegram Mini App
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4 text-center">
        <span className="text-5xl">😕</span>
        <p style={{ color: 'var(--tg-theme-hint-color)' }}>{error}</p>
        <button
          onClick={() => { setLoading(true); init() }}
          className="px-6 py-3 font-semibold"
          style={{
            backgroundColor: 'var(--tg-theme-button-color)',
            color: 'var(--tg-theme-button-text-color)',
            borderRadius: 12,
          }}
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  const { hours, minutes, isUrgent } = timeLeft()
  const streak = user?.streak ?? 0

  return (
    <div className="flex flex-col p-4 gap-4 fade-in" style={{ paddingBottom: 32 }}>
      {/* Header — Streak */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="font-heading leading-none tracking-tight" style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em' }}>
            🔥 {streak}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {streakLabel(streak)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs mb-0.5" style={{ color: 'var(--tg-theme-hint-color)' }}>осталось</div>
          <div
            className="font-heading tabular-nums"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: isUrgent ? 'var(--hs-danger)' : 'var(--tg-theme-text-color)',
            }}
          >
            {hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`}
          </div>
        </div>
      </div>

      {/* Tasks */}
      {squadId && <div className="flex flex-col gap-3">
        {[0, 1, 2].map(i => {
          const task = tasks[i]
          return (
            <div
              key={i}
              className="p-4 flex items-center gap-3 min-h-[64px]"
              style={{
                background: task ? 'var(--tg-theme-secondary-bg-color)' : 'transparent',
                borderRadius: 'var(--hs-radius)',
                boxShadow: task ? 'var(--hs-shadow)' : 'none',
                border: task ? 'none' : '1.5px dashed var(--tg-theme-hint-color)',
                opacity: task ? 1 : 0.5,
              }}
            >
              {task ? (
                <>
                  <button
                    onClick={() => !task.is_done && handleComplete(task.id)}
                    className="flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: `2px solid ${task.is_done ? 'var(--hs-success)' : 'var(--tg-theme-hint-color)'}`,
                      backgroundColor: task.is_done ? 'var(--hs-success)' : 'transparent',
                    }}
                  >
                    {task.is_done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </button>
                  <span
                    className="text-base flex-1"
                    style={{
                      textDecoration: task.is_done ? 'line-through' : 'none',
                      color: task.is_done ? 'var(--tg-theme-hint-color)' : 'var(--tg-theme-text-color)',
                    }}
                  >
                    {task.text}
                  </span>
                </>
              ) : (
                <button
                  onClick={() => squadId ? setShowInput(true) : navigate('/create-join')}
                  className="flex items-center gap-2 w-full"
                  style={{ color: 'var(--tg-theme-hint-color)' }}
                >
                  <span style={{ fontSize: 18, fontWeight: 400 }}>＋</span>
                  <span className="text-sm font-medium">
                    {squadId ? `Добавить задачу` : 'Сначала создай Squad'}
                  </span>
                </button>
              )}
            </div>
          )
        })}
      </div>}

      {/* Add task input */}
      {showInput && tasks.length < 3 && (
        <div className="flex gap-2 fade-in">
          <input
            autoFocus
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            placeholder="Введи задачу..."
            className="input-card flex-1 px-4 py-3"
          />
          <button
            onClick={handleAddTask}
            disabled={addingTask}
            className="flex items-center gap-2 px-5 font-semibold"
            style={{
              backgroundColor: 'var(--tg-theme-button-color)',
              color: 'var(--tg-theme-button-text-color)',
              borderRadius: 12,
              opacity: addingTask ? 0.5 : 1,
            }}
          >
            {addingTask ? <span className="spinner" /> : 'OK'}
          </button>
        </div>
      )}

      {/* Squad section */}
      {squadId ? (
        <button
          onClick={() => navigate(`/squad/${squadId}`)}
          className="card p-4 flex items-center justify-between w-full text-left"
        >
          <div className="flex gap-3 flex-wrap">
            {squadStatus.length > 0 ? squadStatus.slice(0, 3).map(m => (
              <div key={m.user_id} className="flex items-center gap-1 text-sm font-medium">
                <span>{m.name.split(' ')[0]}</span>
                <span style={{
                  color: m.done_count === m.total_count && m.total_count > 0
                    ? 'var(--hs-success)'
                    : 'var(--hs-danger)'
                }}>
                  {m.done_count === m.total_count && m.total_count > 0 ? '✓' : m.total_count > 0 ? '✗' : '—'}
                </span>
              </div>
            )) : (
              <span className="text-sm font-medium" style={{ color: 'var(--tg-theme-hint-color)' }}>
                Открыть Squad
              </span>
            )}
          </div>
          <span style={{ color: 'var(--tg-theme-hint-color)', fontSize: 18 }}>›</span>
        </button>
      ) : (
        <div className="card p-5 flex flex-col items-center gap-3 text-center">
          <span style={{ fontSize: 32 }}>👥</span>
          <div>
            <p className="font-semibold" style={{ fontSize: 15 }}>Нет группы</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--tg-theme-hint-color)' }}>
              Создай Squad или вступи по коду друга
            </p>
          </div>
          <button
            onClick={() => navigate('/create-join')}
            className="w-full py-3 font-semibold text-sm"
            style={{
              backgroundColor: 'var(--tg-theme-button-color)',
              color: 'var(--tg-theme-button-text-color)',
              borderRadius: 12,
            }}
          >
            Создать Squad
          </button>
        </div>
      )}
    </div>
  )
}
