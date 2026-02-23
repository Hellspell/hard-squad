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
              className="transition-all duration-300"
              style={{
                height: 6,
                borderRadius: 99,
                width: i === slide ? 24 : 6,
                backgroundColor: i === slide
                  ? 'var(--tg-theme-button-color)'
                  : 'var(--tg-theme-hint-color)',
                opacity: i === slide ? 1 : 0.4,
              }}
            />
          ))}
        </div>
        {!isLast && (
          <button
            onClick={() => navigate('/home')}
            className="text-sm py-1 px-2"
            style={{ color: 'var(--tg-theme-hint-color)' }}
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
        <span style={{ fontSize: 72 }}>{current.emoji}</span>
        <h1
          className="font-heading"
          style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}
        >
          {current.title}
        </h1>
        <p
          className="text-base leading-relaxed"
          style={{
            color: 'var(--tg-theme-hint-color)',
            maxWidth: 280,
            lineHeight: 1.6,
          }}
        >
          {current.desc}
        </p>
      </div>

      {/* Button */}
      <button
        onClick={goNext}
        className="w-full py-4 font-semibold text-base transition-opacity active:opacity-70"
        style={{
          backgroundColor: 'var(--tg-theme-button-color)',
          color: 'var(--tg-theme-button-text-color)',
          borderRadius: 'var(--hs-radius)',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {isLast ? 'Я готов' : 'Далее'}
      </button>
    </div>
  )
}
