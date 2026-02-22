import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SLIDES = [
  {
    emoji: '🎯',
    title: 'Только 3 задачи',
    desc: 'Каждый день — максимум 3 задачи. Не больше. Выбери только то, что реально важно.',
  },
  {
    emoji: '🔥',
    title: 'Нет переноса',
    desc: 'Не выполнил до конца дня — streak обнуляется. Твои друзья это видят.',
  },
  {
    emoji: '👥',
    title: 'Squad видит всё',
    desc: 'Создай группу с друзьями. Взаимная ответственность — лучший инструмент дисциплины.',
  },
]

export default function Onboarding() {
  const [slide, setSlide] = useState(0)
  const navigate = useNavigate()

  const isLast = slide === SLIDES.length - 1
  const current = SLIDES[slide]

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6">
      {/* Dots */}
      <div className="flex gap-2 pt-4">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === slide ? 'w-6 bg-[var(--tg-theme-button-color)]' : 'w-1.5 bg-[var(--tg-theme-hint-color)]'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col items-center text-center gap-6">
        <span className="text-7xl">{current.emoji}</span>
        <h1 className="text-2xl font-bold">{current.title}</h1>
        <p className="text-[var(--tg-theme-hint-color)] text-base leading-relaxed max-w-xs">
          {current.desc}
        </p>
      </div>

      {/* Button */}
      <button
        onClick={() => (isLast ? navigate('/home') : setSlide(s => s + 1))}
        className="w-full py-4 rounded-2xl font-semibold text-base transition-opacity active:opacity-70"
        style={{
          backgroundColor: 'var(--tg-theme-button-color)',
          color: 'var(--tg-theme-button-text-color)',
        }}
      >
        {isLast ? 'Я готов' : 'Далее'}
      </button>
    </div>
  )
}
