import React, { useEffect, useRef, useState } from 'react'

type Particle = {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  size: number
  color: string
  rotate: number
  duration: number
}

const MOBILE_MEDIA_QUERY = '(max-width: 768px)'

const COLORS = [
  'rgba(255,255,255,0.95)',
  'rgba(147,197,253,0.95)',
  'rgba(196,181,253,0.95)',
  'rgba(244,114,182,0.92)',
  'rgba(96,165,250,0.92)',
]

function random(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function createBurst(x: number, y: number, isMobile: boolean): Particle[] {
  const count = isMobile ? 6 : 10
  const spread = isMobile ? 36 : 52
  const baseSize = isMobile ? 5 : 6
  const now = Date.now() + Math.floor(Math.random() * 100000)

  return Array.from({ length: count }).map((_, index) => {
    const angle = (Math.PI * 2 * index) / count + random(-0.18, 0.18)
    const distance = random(spread * 0.45, spread)
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance

    return {
      id: now + index,
      x,
      y,
      dx,
      dy,
      size: random(baseSize - 1.5, baseSize + 2),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: random(0, 180),
      duration: random(520, 760),
    }
  })
}

export default function ClickParticles() {
  const [particles, setParticles] = useState<Particle[]>([])
  const isTouchMovingRef = useRef(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const lastEmitRef = useRef(0)

  useEffect(() => {
    const isMobile = () => window.matchMedia(MOBILE_MEDIA_QUERY).matches

    const emit = (x: number, y: number) => {
      const now = Date.now()
      if (now - lastEmitRef.current < 40) return
      lastEmitRef.current = now

      const burst = createBurst(x, y, isMobile())
      setParticles((prev) => [...prev, ...burst])

      burst.forEach((item) => {
        window.setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== item.id))
        }, item.duration)
      })
    }

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if (e.pointerType === 'touch') return
      emit(e.clientX, e.clientY)
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return

      isTouchMovingRef.current = false
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const start = touchStartRef.current
      if (!touch || !start) return

      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 10) {
        isTouchMovingRef.current = true
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTouchMovingRef.current) return

      const touch = e.changedTouches[0]
      if (!touch) return

      emit(touch.clientX, touch.clientY)
    }

    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return (
    <>
      <style>
        {`
          .click-particles-layer {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
          }

          .click-particle {
            position: fixed;
            left: 0;
            top: 0;
            border-radius: 999px;
            pointer-events: none;
            will-change: transform, opacity;
            transform: translate3d(0, 0, 0) scale(1);
            animation-name: click-particle-burst;
            animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
            animation-fill-mode: forwards;
            box-shadow:
              0 0 6px rgba(255,255,255,0.45),
              0 0 12px rgba(147,197,253,0.25);
          }

          @keyframes click-particle-burst {
            0% {
              opacity: 0.95;
              transform: translate3d(0, 0, 0) scale(1);
            }
            70% {
              opacity: 0.85;
            }
            100% {
              opacity: 0;
              transform: translate3d(var(--dx), var(--dy), 0) scale(0.2) rotate(var(--rotate));
            }
          }
        `}
      </style>

      <div className="click-particles-layer" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="click-particle"
            style={
              {
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.color,
                transform: `translate3d(${p.x - p.size / 2}px, ${p.y - p.size / 2}px, 0)`,
                animationDuration: `${p.duration}ms`,
                animationName: 'click-particle-burst',
                ['--dx' as any]: `${p.dx}px`,
                ['--dy' as any]: `${p.dy}px`,
                ['--rotate' as any]: `${p.rotate}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  )
}
