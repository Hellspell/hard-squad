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
        <div className="skeleton h-10 w-16 rounded-xl" />
      </div>
      <div className="flex flex-col gap-2 flex-1">
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
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_done: true } : t))
      try {
        const updated = await completeTask(taskId)
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t))
        tg?.HapticFeedback.notificationOccurred('success')
      } catch {
        // Rollback
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_done: false } : t))
        tg?.HapticFeedback.notificationOccurred('error')
      }
    })
  }

  if (loading) return <SkeletonHome />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4 text-center">
        <span className="text-5xl">😕</span>
        <p className="text-[var(--tg-theme-hint-color)]">{error}</p>
        <button
          onClick={() => { setLoading(true); init() }}
          className="px-6 py-3 rounded-2xl font-semibold"
          style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  const { hours, minutes, isUrgent } = timeLeft()
  const streak = user?.streak ?? 0

  return (
    <div className="flex flex-col min-h-screen p-4 gap-4 fade-in">
      {/* Header — Streak */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="text-6xl font-black tracking-tight leading-none">
            🔥 {streak}
          </div>
          <div className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
            {streakLabel(streak)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--tg-theme-hint-color)]">осталось</div>
          <div className={`text-2xl font-bold tabular-nums ${isUrgent ? 'text-red-400' : ''}`}>
            {hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-2 flex-1">
        {[0, 1, 2].map(i => {
          const task = tasks[i]
          return (
            <div
              key={i}
              className="rounded-2xl p-4 flex items-center gap-3 min-h-[64px]"
              style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
            >
              {task ? (
                <>
                  <button
                    onClick={() => !task.is_done && handleComplete(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      task.is_done
                        ? 'border-green-500 bg-green-500'
                        : 'border-[var(--tg-theme-hint-color)]'
                    }`}
                  >
                    {task.is_done && <span className="text-white text-xs">✓</span>}
                  </button>
                  <span className={`text-base flex-1 ${task.is_done ? 'line-through text-[var(--tg-theme-hint-color)]' : ''}`}>
                    {task.text}
                  </span>
                </>
              ) : (
                <button
                  onClick={() => squadId ? setShowInput(true) : navigate('/create-join')}
                  className="flex items-center gap-2 text-[var(--tg-theme-hint-color)] w-full"
                >
                  <span className="text-xl">+</span>
                  <span className="text-sm">{squadId ? `Задача ${i + 1}` : 'Сначала создай Squad'}</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Add task input */}
      {showInput && tasks.length < 3 && (
        <div className="flex gap-2 fade-in">
          <input
            autoFocus
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            placeholder="Введи задачу..."
            className="flex-1 px-4 py-3 rounded-2xl outline-none text-base"
            style={{
              backgroundColor: 'var(--tg-theme-secondary-bg-color)',
              color: 'var(--tg-theme-text-color)',
            }}
          />
          <button
            onClick={handleAddTask}
            disabled={addingTask}
            className="px-5 py-3 rounded-2xl font-semibold disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
          >
            {addingTask ? <span className="spinner" /> : 'OK'}
          </button>
        </div>
      )}

      {/* Squad section */}
      {squadId ? (
        <button
          onClick={() => navigate(`/squad/${squadId}`)}
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >
          <div className="flex gap-3 flex-wrap">
            {squadStatus.length > 0 ? squadStatus.slice(0, 3).map(m => (
              <div key={m.user_id} className="flex items-center gap-1 text-sm">
                <span>{m.name.split(' ')[0]}</span>
                <span className={m.done_count === m.total_count && m.total_count > 0 ? 'text-green-500' : 'text-red-400'}>
                  {m.done_count === m.total_count && m.total_count > 0 ? '✓' : m.total_count > 0 ? '✗' : '—'}
                </span>
              </div>
            )) : (
              <span className="text-sm text-[var(--tg-theme-hint-color)]">Открыть Squad</span>
            )}
          </div>
          <span className="text-[var(--tg-theme-hint-color)] text-sm">→</span>
        </button>
      ) : (
        <div
          className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >
          <span className="text-3xl">👥</span>
          <div>
            <p className="font-semibold">Нет группы</p>
            <p className="text-sm text-[var(--tg-theme-hint-color)] mt-0.5">
              Создай Squad или вступи по коду друга
            </p>
          </div>
          <button
            onClick={() => navigate('/create-join')}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
          >
            Создать Squad
          </button>
        </div>
      )}
    </div>
  )
}
