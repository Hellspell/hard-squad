const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

function getInitData(): string {
  return window.Telegram?.WebApp?.initData ?? ''
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': getInitData(),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }

  return res.json()
}

// --- Auth ---
export const auth = () =>
  request<{ user: User; token: string }>('/users/auth', { method: 'POST' })

// --- Squads ---
export const getSquadByCode = (code: string) =>
  request<Squad>(`/squads/${code}`)

export const createSquad = (name: string) =>
  request<Squad>('/squads', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })

export const joinSquad = (squadId: string) =>
  request<Squad>(`/squads/${squadId}/join`, { method: 'POST' })

export const getSquadToday = (squadId: string) =>
  request<SquadToday>(`/squads/${squadId}/today`)

// --- Tasks ---
export const addTasks = (squadId: string, tasks: string[]) =>
  request<DailyTask>('/tasks', {
    method: 'POST',
    body: JSON.stringify({ squad_id: squadId, tasks }),
  })

export const completeTask = (taskId: string) =>
  request<Task>(`/tasks/${taskId}/done`, { method: 'PATCH' })

// --- User ---
export const getMe = () => request<User>('/users/me')

// --- Types ---
export interface User {
  id: number
  name: string
  username?: string
  streak: number
  best_streak: number
}

export interface Squad {
  id: string
  name: string
  invite_code: string
  members: SquadMember[]
}

export interface SquadMember {
  user_id: number
  name: string
  streak: number
}

export interface SquadToday {
  squad_id: string
  date: string
  members: MemberStatus[]
}

export interface MemberStatus {
  user_id: number
  name: string
  streak: number
  tasks: Task[]
  done_count: number
  total_count: number
}

export interface DailyTask {
  id: string
  user_id: number
  squad_id: string
  date: string
  tasks: Task[]
}

export interface Task {
  id: string
  text: string
  is_done: boolean
  position: number
}
