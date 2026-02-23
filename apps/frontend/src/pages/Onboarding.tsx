import { useState, useRef } from 'react'
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
  const [direction, setDirection] = useState<'left' | 'right'>('left')
  const navigate = useNavigate()
  const touchStartX = useRef<number | null>(null)

  const isLast = slide === SLIDES.length - 1
  const current = SLIDES[slide]

  function goNext() {
    if (isLast) {
      navigate('/home')
    } else {
      setDirection('left')
      setSlide(s => s + 1)
    }
  }

  function goPrev() {
    if (slide > 0) {
      setDirection('right')
      setSlide(s => s - 1)
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  return (
    <div
      className="flex flex-col items-center justify-between min-h-screen p-6 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top row: dots + skip */}
      <div className="flex items-center justify-between w-full pt-2">
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === slide ? 'w-6 bg-[var(--tg-theme-button-color)]' : 'w-1.5 bg-[var(--tg-theme-hint-color)]'
              }`}
            />
          ))}
        </div>
        {!isLast && (
          <button
            onClick={() => navigate('/home')}
            className="text-sm text-[var(--tg-theme-hint-color)] py-1 px-2"
          >
            Пропустить
          </button>
        )}
      </div>

      {/* Content */}
      <div
        key={`${slide}-${direction}`}
        className="flex flex-col items-center text-center gap-6 fade-in"
      >
        <span className="text-7xl">{current.emoji}</span>
        <h1 className="text-2xl font-bold">{current.title}</h1>
        <p className="text-[var(--tg-theme-hint-color)] text-base leading-relaxed max-w-xs">
          {current.desc}
        </p>
      </div>

      {/* Button */}
      <button
        onClick={goNext}
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
