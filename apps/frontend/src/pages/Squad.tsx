import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSquadToday, leaveSquad } from '../api'
import type { SquadToday, MemberStatus } from '../api'
import { tg } from '../App'

function SkeletonSquad() {
  return (
    <div className="flex flex-col min-h-screen p-4 gap-4">
      <div className="pt-2">
        <div className="skeleton h-6 w-24 mb-2" />
        <div className="skeleton h-4 w-40" />
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className="skeleton h-28 w-full" />
      ))}
    </div>
  )
}

function sortMembers(members: MemberStatus[]): MemberStatus[] {
  return [...members].sort((a, b) => {
    const aDone = a.total_count > 0 && a.done_count === a.total_count
    const bDone = b.total_count > 0 && b.done_count === b.total_count
    const aStarted = a.total_count > 0
    const bStarted = b.total_count > 0
    if (aDone && !bDone) return -1
    if (!aDone && bDone) return 1
    if (aStarted && !bStarted) return -1
    if (!aStarted && bStarted) return 1
    return b.streak - a.streak
  })
}

export default function Squad() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<SquadToday | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const inviteCode = localStorage.getItem('hs_invite_code') ?? ''

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      const result = await getSquadToday(id)
      setData(result)
      setError(null)
      setLastUpdated(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    }
  }, [id])

  useEffect(() => {
    tg?.BackButton.show()
    tg?.BackButton.onClick(() => navigate('/home'))

    fetchData().finally(() => setLoading(false))

    // Auto-refresh every 30s
    intervalRef.current = setInterval(fetchData, 30_000)

    return () => {
      tg?.BackButton.hide()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [id, navigate, fetchData])

  function copyCode() {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShare() {
    if ('share' in navigator) {
      navigator.share({ text: `Вступи в мой Hard Squad! Код: ${inviteCode}` }).catch(() => copyCode())
    } else {
      copyCode()
    }
  }

  function handleLeave() {
    if (!id) return
    tg?.showConfirm('Выйти из Squad? Твои задачи сохранятся.', async (ok) => {
      if (!ok) return
      await leaveSquad(id)
      localStorage.removeItem('hs_squad_id')
      localStorage.removeItem('hs_invite_code')
      navigate('/home')
    })
  }

  const secondsAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : null

  if (loading) return <SkeletonSquad />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4 text-center">
        <span className="text-5xl">😕</span>
        <p className="text-[var(--tg-theme-hint-color)]">{error}</p>
        <button
          onClick={() => { setLoading(true); fetchData().finally(() => setLoading(false)) }}
          className="px-6 py-3 rounded-2xl font-semibold"
          style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  const sorted = sortMembers(data?.members ?? [])
  const isAlone = sorted.length <= 1

  return (
    <div className="flex flex-col min-h-screen p-4 gap-4 fade-in">
      <div className="pt-2">
        <h1 className="text-xl font-bold">Сегодня</h1>
        <p className="text-sm text-[var(--tg-theme-hint-color)]">
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Alone state */}
      {isAlone && inviteCode && (
        <div
          className="rounded-2xl p-4 text-center"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >
          <p className="text-base font-semibold mb-1">Пригласи участников!</p>
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            Поделись кодом ниже 👇
          </p>
        </div>
      )}

      {/* Members */}
      {sorted.map(member => (
        <div
          key={member.user_id}
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
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

          {member.tasks.length === 0 ? (
            <p className="text-sm text-[var(--tg-theme-hint-color)]">— Ещё не добавил задачи</p>
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

      <div className="mt-auto flex flex-col gap-3">
        {/* Invite code */}
        {inviteCode && (
          <div
            className="rounded-2xl p-4 flex items-center justify-between"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            <div>
              <p className="text-xs text-[var(--tg-theme-hint-color)] mb-1">Код приглашения</p>
              <p className="text-2xl font-mono font-bold tracking-widest">{inviteCode}</p>
            </div>
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
            >
              {copied ? '✓ Скопировано' : 'share' in navigator ? 'Поделиться' : 'Копировать'}
            </button>
          </div>
        )}

        {/* Last updated */}
        {secondsAgo !== null && (
          <p className="text-center text-xs text-[var(--tg-theme-hint-color)]">
            обновлено {secondsAgo < 5 ? 'только что' : `${secondsAgo} сек назад`}
          </p>
        )}

        {/* Leave squad */}
        <button
          onClick={handleLeave}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-red-400"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
        >
          Выйти из Squad
        </button>
      </div>
    </div>
  )
}
