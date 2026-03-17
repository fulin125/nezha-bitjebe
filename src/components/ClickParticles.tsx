import React, { useEffect, useRef, useState } from "react"

type Particle = {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  size: number
  color: string
  duration: number
}

const MOBILE_MEDIA_QUERY = "(max-width: 768px)"

const COLORS = [
  "rgba(255,255,255,0.95)",
  "rgba(191,219,254,0.92)",
  "rgba(147,197,253,0.9)",
  "rgba(216,180,254,0.92)",
  "rgba(196,181,253,0.9)",
  "rgba(251,207,232,0.92)",
  "rgba(244,114,182,0.82)",
  "rgba(253,230,138,0.88)",
  "rgba(167,243,208,0.88)",
  "rgba(125,211,252,0.88)",
]

function random(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function createBurst(x: number, y: number, isMobile: boolean): Particle[] {
  const count = isMobile ? 14 : 22
  const spread = isMobile ? 70 : 110
  const baseSize = isMobile ? 4.2 : 5.2
  const now = Date.now() + Math.floor(Math.random() * 100000)

  return Array.from({ length: count }).map((_, index) => {
    const angle = (Math.PI * 2 * index) / count + random(-0.1, 0.1)
    const distance = random(spread * 0.35, spread)

    return {
      id: now + index,
      x,
      y,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: random(baseSize - 0.8, baseSize + 1.4),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: random(200, 280), // 0.20s ~ 0.28s
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
      if (now - lastEmitRef.current < 30) return
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
      if (e.pointerType === "mouse" && e.button !== 0) return
      if (e.pointerType === "touch") return
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

    window.addEventListener("pointerdown", handlePointerDown, { passive: true })
    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
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

          .click-particle-anchor {
            position: fixed;
            pointer-events: none;
            left: 0;
            top: 0;
            width: 0;
            height: 0;
          }

          .click-particle-dot {
            position: absolute;
            left: 0;
            top: 0;
            border-radius: 999px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            will-change: transform, opacity;
            animation-name: click-particle-burst;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
            box-shadow: 0 0 6px rgba(255,255,255,0.2);
          }

          @keyframes click-particle-burst {
            0% {
              opacity: 0.95;
              transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(1);
            }
            100% {
              opacity: 0;
              transform:
                translate(-50%, -50%)
                translate3d(var(--dx), var(--dy), 0)
                scale(0.7);
            }
          }
        `}
      </style>

      <div className="click-particles-layer" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="click-particle-anchor"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
            }}
          >
            <span
              className="click-particle-dot"
              style={
                {
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: p.color,
                  animationDuration: `${p.duration}ms`,
                  ["--dx" as any]: `${p.dx}px`,
                  ["--dy" as any]: `${p.dy}px`,
                } as React.CSSProperties
              }
            />
          </span>
        ))}
      </div>
    </>
  )
}
