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

  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 5000)
    return () => clearInterval(t)
  }, [])
  const secondsAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : null
  void tick // trigger re-render for live counter

  if (loading) return <SkeletonSquad />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4 text-center">
        <span className="text-5xl">😕</span>
        <p style={{ color: 'var(--tg-theme-hint-color)' }}>{error}</p>
        <button
          onClick={() => { setLoading(true); fetchData().finally(() => setLoading(false)) }}
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

  const sorted = sortMembers(data?.members ?? [])
  const isAlone = sorted.length <= 1

  return (
    <div className="flex flex-col min-h-screen p-4 gap-4 fade-in">
      <div className="pt-2">
        <h1 className="font-heading" style={{ fontSize: 22, fontWeight: 800 }}>Сегодня</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--tg-theme-hint-color)' }}>
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>


      {/* Members */}
      {sorted.map(member => {
        const isDone = member.total_count > 0 && member.done_count === member.total_count
        return (
          <div key={member.user_id} className="card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center flex-shrink-0 font-heading"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: 'var(--tg-theme-button-color)',
                    color: 'var(--tg-theme-button-text-color)',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {member.name[0]}
                </div>
                <span className="font-semibold" style={{ fontSize: 15 }}>{member.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  🔥 {member.streak}
                </span>
                {member.total_count > 0 && (
                  <span
                    className="text-sm font-bold"
                    style={{ color: isDone ? 'var(--hs-success)' : 'var(--tg-theme-hint-color)' }}
                  >
                    {member.done_count}/{member.total_count}
                  </span>
                )}
              </div>
            </div>

            {member.tasks.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
                — Ещё не добавил задачи
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {member.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <span style={{ color: task.is_done ? 'var(--hs-success)' : 'var(--tg-theme-hint-color)' }}>
                      {task.is_done ? '✓' : '○'}
                    </span>
                    <span style={{
                      textDecoration: task.is_done ? 'line-through' : 'none',
                      color: task.is_done ? 'var(--tg-theme-hint-color)' : 'var(--tg-theme-text-color)',
                    }}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="mt-auto flex flex-col gap-3">
        {/* Invite code */}
        {inviteCode && (
          <div className="card p-4">
            {isAlone && (
              <p className="font-semibold mb-3" style={{ fontSize: 15 }}>
                👋 Пригласи первого участника!
              </p>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Код приглашения
                </p>
                <p className="font-mono font-bold tracking-widest" style={{ fontSize: 22 }}>
                  {inviteCode}
                </p>
              </div>
              <button
                onClick={handleShare}
                className="px-4 py-2 font-semibold text-sm"
                style={{
                  backgroundColor: 'var(--tg-theme-button-color)',
                  color: 'var(--tg-theme-button-text-color)',
                  borderRadius: 10,
                }}
              >
                {copied ? '✓ Скопировано' : 'share' in navigator ? 'Поделиться' : 'Копировать'}
              </button>
            </div>
          </div>
        )}

        {/* Last updated */}
        {secondsAgo !== null && (
          <p className="text-center text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
            обновлено {secondsAgo < 5 ? 'только что' : `${secondsAgo} сек назад`}
          </p>
        )}

        {/* Leave squad */}
        <button
          onClick={handleLeave}
          className="w-full py-3 font-semibold text-sm"
          style={{
            backgroundColor: 'var(--tg-theme-secondary-bg-color)',
            color: 'var(--hs-danger)',
            borderRadius: 'var(--hs-radius)',
            boxShadow: 'var(--hs-shadow)',
          }}
        >
          Выйти из Squad
        </button>
      </div>
    </div>
  )
}
