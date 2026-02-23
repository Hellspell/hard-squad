import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSquad, getSquadByCode, joinSquad } from '../api'
import { tg } from '../App'

type Mode = 'select' | 'create' | 'join'

export default function CreateJoin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('select')
  const [squadName, setSquadName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (squadName.trim().length < 2) {
      setError('Название должно быть не менее 2 символов')
      return
    }
    setLoading(true)
    setError('')
    try {
      const squad = await createSquad(squadName.trim())
      localStorage.setItem('hs_squad_id', squad.id)
      localStorage.setItem('hs_invite_code', squad.invite_code)
      tg?.HapticFeedback.notificationOccurred('success')
      navigate('/home')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
      tg?.HapticFeedback.notificationOccurred('error')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (inviteCode.trim().length < 6) {
      setError('Код должен быть не менее 6 символов')
      return
    }
    setLoading(true)
    setError('')
    try {
      const squad = await getSquadByCode(inviteCode.trim().toUpperCase())
      await joinSquad(squad.id)
      localStorage.setItem('hs_squad_id', squad.id)
      localStorage.setItem('hs_invite_code', squad.invite_code)
      tg?.HapticFeedback.notificationOccurred('success')
      navigate('/home')
    } catch {
      setError('Неверный код или squad не найден')
      tg?.HapticFeedback.notificationOccurred('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen p-4 gap-6">
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Squad</h1>
        <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
          Создай группу или вступи по коду
        </p>
      </div>

      {mode === 'select' && (
        <div className="flex flex-col gap-3 flex-1 justify-center fade-in">
          <button
            onClick={() => { setMode('create'); setError('') }}
            className="w-full py-4 rounded-2xl font-semibold text-base"
            style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
          >
            Создать Squad
          </button>
          <button
            onClick={() => { setMode('join'); setError('') }}
            className="w-full py-4 rounded-2xl font-semibold text-base"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
          >
            Войти по коду
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="flex flex-col gap-3 flex-1 fade-in">
          <input
            autoFocus
            value={squadName}
            onChange={e => { setSquadName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Название squad..."
            maxLength={30}
            className="w-full px-4 py-4 rounded-2xl outline-none text-base"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}
          />
          {error && <p className="text-red-400 text-sm px-1">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={loading || !squadName.trim()}
            className="w-full py-4 rounded-2xl font-semibold text-base disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
          >
            {loading ? <><span className="spinner" /> Создаём...</> : 'Создать'}
          </button>
          <button
            onClick={() => { setMode('select'); setError('') }}
            className="text-[var(--tg-theme-hint-color)] text-sm py-2"
          >
            Назад
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="flex flex-col gap-3 flex-1 fade-in">
          <input
            autoFocus
            value={inviteCode}
            onChange={e => { setInviteCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="Код приглашения"
            maxLength={8}
            className="w-full px-4 py-4 rounded-2xl outline-none text-base text-center tracking-widest font-mono"
            style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={handleJoin}
            disabled={loading || !inviteCode.trim()}
            className="w-full py-4 rounded-2xl font-semibold text-base disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
          >
            {loading ? <><span className="spinner" /> Входим...</> : 'Войти'}
          </button>
          <button
            onClick={() => { setMode('select'); setError('') }}
            className="text-[var(--tg-theme-hint-color)] text-sm py-2"
          >
            Назад
          </button>
        </div>
      )}
    </div>
  )
}
