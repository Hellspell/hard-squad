import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Squad from './pages/Squad'
import CreateJoin from './pages/CreateJoin'
import Onboarding from './pages/Onboarding'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        initData: string
        initDataUnsafe: { user?: { id: number; first_name: string; username?: string } }
        colorScheme: 'light' | 'dark'
        themeParams: Record<string, string>
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
        }
        BackButton: { show: () => void; hide: () => void; onClick: (cb: () => void) => void }
        showConfirm: (message: string, callback: (ok: boolean) => void) => void
      }
    }
  }
}

export const tg = window.Telegram?.WebApp

function App() {
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null)

  useEffect(() => {
    tg?.ready()
    tg?.expand()

    // Применяем тему Telegram
    const params = tg?.themeParams
    if (params) {
      const root = document.documentElement
      if (params.bg_color) root.style.setProperty('--tg-theme-bg-color', params.bg_color)
      if (params.text_color) root.style.setProperty('--tg-theme-text-color', params.text_color)
      if (params.hint_color) root.style.setProperty('--tg-theme-hint-color', params.hint_color)
      if (params.link_color) root.style.setProperty('--tg-theme-link-color', params.link_color)
      if (params.button_color) root.style.setProperty('--tg-theme-button-color', params.button_color)
      if (params.button_text_color) root.style.setProperty('--tg-theme-button-text-color', params.button_text_color)
      if (params.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', params.secondary_bg_color)
    }

    // Проверяем: новый пользователь или нет
    const visited = localStorage.getItem('hs_visited')
    setIsNewUser(!visited)
    if (!visited) localStorage.setItem('hs_visited', '1')
  }, [])

  if (isNewUser === null) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isNewUser ? <Onboarding /> : <Navigate to="/home" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/home" element={<Home />} />
        <Route path="/squad/:id" element={<Squad />} />
        <Route path="/create-join" element={<CreateJoin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
