import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, addTasks, completeTask, getSquadToday } from '../api'
import type { User, MemberStatus, Task } from '../api'
import { tg } from '../App'

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [squadStatus, setSquadStatus] = useState<MemberStatus[]>([])
  const [squadId, setSquadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInput, setShowInput] = useState(false)
  const [inputText, setInputText] = useState('')

  useEffect(() => {
    init()
  }, [])

  async function init() {
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
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddTask() {
    if (!inputText.trim() || !squadId) return
    if (tasks.length >= 3) return

    tg?.HapticFeedback.impactOccurred('light')
    try {
      const daily = await addTasks(squadId, [...tasks.map(t => t.text), inputText.trim()])
      setTasks(daily.tasks)
      setInputText('')
      setShowInput(false)
    } catch (e) {
      tg?.HapticFeedback.notificationOccurred('error')
    }
  }

  async function handleComplete(taskId: string) {
    tg?.HapticFeedback.impactOccurred('medium')
    try {
      const updated = await completeTask(taskId)
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)))
      tg?.HapticFeedback.notificationOccurred('success')
    } catch (e) {
      tg?.HapticFeedback.notificationOccurred('error')
    }
  }

  const hoursLeft = () => {
    const now = new Date()
    const end = new Date()
    end.setHours(23, 59, 0, 0)
    const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000 / 60 / 60))
    return diff
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen p-4 gap-4">
      {/* Header — Streak */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="text-4xl font-black tracking-tight">
            🔥 {user?.streak ?? 0}
          </div>
          <div className="text-sm text-[var(--tg-theme-hint-color)] mt-0.5">
            дней подряд
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-[var(--tg-theme-hint-color)]">осталось</div>
          <div className="text-2xl font-bold">{hoursLeft()}ч</div>
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
                  <span
                    className={`text-base flex-1 ${
                      task.is_done
                        ? 'line-through text-[var(--tg-theme-hint-color)]'
                        : ''
                    }`}
                  >
                    {task.text}
                  </span>
                </>
              ) : (
                <button
                  onClick={() => setShowInput(true)}
                  className="flex items-center gap-2 text-[var(--tg-theme-hint-color)] w-full"
                >
                  <span className="text-xl">+</span>
                  <span className="text-sm">Задача {i + 1}</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Add task input */}
      {showInput && tasks.length < 3 && (
        <div className="flex gap-2">
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
            className="px-5 py-3 rounded-2xl font-semibold"
            style={{
              backgroundColor: 'var(--tg-theme-button-color)',
              color: 'var(--tg-theme-button-text-color)',
            }}
          >
            OK
          </button>
        </div>
      )}

      {/* Squad mini status */}
      {squadId ? (
        <button
          onClick={() => navigate(`/squad/${squadId}`)}
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >
          <div className="flex gap-3">
            {squadStatus.slice(0, 3).map(m => (
              <div key={m.user_id} className="flex items-center gap-1 text-sm">
                <span>{m.name.split(' ')[0]}</span>
                <span className={m.done_count === m.total_count && m.total_count > 0 ? 'text-green-500' : 'text-red-400'}>
                  {m.done_count === m.total_count && m.total_count > 0 ? '✓' : m.total_count > 0 ? '✗' : '—'}
                </span>
              </div>
            ))}
          </div>
          <span className="text-[var(--tg-theme-hint-color)] text-sm">→</span>
        </button>
      ) : (
        <button
          onClick={() => navigate('/create-join')}
          className="w-full py-4 rounded-2xl font-semibold text-base"
          style={{
            backgroundColor: 'var(--tg-theme-button-color)',
            color: 'var(--tg-theme-button-text-color)',
          }}
        >
          Создать Squad
        </button>
      )}
    </div>
  )
}
