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
        <h1 className="font-heading" style={{ fontSize: 26, fontWeight: 800 }}>Squad</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
          Создай группу или вступи по коду
        </p>
      </div>

      {mode === 'select' && (
        <div className="flex flex-col gap-3 flex-1 justify-center fade-in">
          <button
            onClick={() => { setMode('create'); setError('') }}
            className="w-full py-4 font-semibold text-base"
            style={{
              backgroundColor: 'var(--tg-theme-button-color)',
              color: 'var(--tg-theme-button-text-color)',
              borderRadius: 'var(--hs-radius)',
            }}
          >
            Создать Squad
          </button>
          <button
            onClick={() => { setMode('join'); setError('') }}
            className="w-full py-4 font-semibold text-base card"
            style={{ color: 'var(--tg-theme-text-color)' }}
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
            className="input-card px-4 py-4"
          />
          {error && (
            <p className="text-sm px-1" style={{ color: 'var(--hs-danger)' }}>{error}</p>
          )}
          <button
            onClick={handleCreate}
            disabled={loading || !squadName.trim()}
            className="w-full py-4 font-semibold text-base flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--tg-theme-button-color)',
              color: 'var(--tg-theme-button-text-color)',
              borderRadius: 'var(--hs-radius)',
              opacity: loading || !squadName.trim() ? 0.5 : 1,
            }}
          >
            {loading ? <><span className="spinner" /> Создаём...</> : 'Создать'}
          </button>
          <button
            onClick={() => { setMode('select'); setError('') }}
            className="text-sm py-2"
            style={{ color: 'var(--tg-theme-hint-color)' }}
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
            className="input-card px-4 py-4 text-center tracking-widest font-mono"
          />
          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--hs-danger)' }}>{error}</p>
          )}
          <button
            onClick={handleJoin}
            disabled={loading || !inviteCode.trim()}
            className="w-full py-4 font-semibold text-base flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--tg-theme-button-color)',
              color: 'var(--tg-theme-button-text-color)',
              borderRadius: 'var(--hs-radius)',
              opacity: loading || !inviteCode.trim() ? 0.5 : 1,
            }}
          >
            {loading ? <><span className="spinner" /> Входим...</> : 'Войти'}
          </button>
          <button
            onClick={() => { setMode('select'); setError('') }}
            className="text-sm py-2"
            style={{ color: 'var(--tg-theme-hint-color)' }}
          >
            Назад
          </button>
        </div>
      )}
    </div>
  )
}
