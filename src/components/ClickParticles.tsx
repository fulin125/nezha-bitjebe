import React, { useEffect, useRef, useState } from "react"

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

const MOBILE_MEDIA_QUERY = "(max-width: 768px)"

// 测试专用：全部改成大红点，方便肉眼确认是否生效
const COLORS = ["rgba(255,0,0,1)"]

function random(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function createBurst(x: number, y: number, isMobile: boolean): Particle[] {
  // 测试专用：粒子数量减少，方便观察
  const count = isMobile ? 3 : 4

  // 测试专用：扩散距离缩小，确保大红点集中在点击附近
  const spread = isMobile ? 20 : 30

  // 测试专用：粒子变得非常大
  const baseSize = isMobile ? 40 : 60

  const now = Date.now() + Math.floor(Math.random() * 100000)

  return Array.from({ length: count }).map((_, index) => {
    const angle = (Math.PI * 2 * index) / count + random(-0.15, 0.15)
    const distance = random(spread * 0.5, spread)

    return {
      id: now + index,
      x,
      y,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: random(baseSize - 5, baseSize + 8),
      color: COLORS[0],
      rotate: random(0, 180),
      duration: random(700, 1000),
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
            pointer-events: none;
            will-change: transform, opacity;
            animation-name: click-particle-burst;
            animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
            animation-fill-mode: forwards;
            box-shadow:
              0 0 12px rgba(255,0,0,0.9),
              0 0 24px rgba(255,0,0,0.7),
              0 0 40px rgba(255,0,0,0.45);
          }

          @keyframes click-particle-burst {
            0% {
              opacity: 1;
              transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(1);
            }
            70% {
              opacity: 0.95;
            }
            100% {
              opacity: 0;
              transform:
                translate(-50%, -50%)
                translate3d(var(--dx), var(--dy), 0)
                scale(0.35)
                rotate(var(--rotate));
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
                  ["--rotate" as any]: `${p.rotate}deg`,
                } as React.CSSProperties
              }
            />
          </span>
        ))}
      </div>
    </>
  )
}
