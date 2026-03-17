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
  trailLength: number
  trailThickness: number
}

const MOBILE_MEDIA_QUERY = "(max-width: 768px)"

const COLORS = [
  "rgba(255,255,255,0.95)",
  "rgba(191,219,254,0.92)",
  "rgba(216,180,254,0.92)",
  "rgba(251,207,232,0.9)",
  "rgba(253,230,138,0.88)",
  "rgba(167,243,208,0.88)",
]

function random(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function createBurst(x: number, y: number, isMobile: boolean): Particle[] {
  const count = isMobile ? 18 : 30
  const spread = isMobile ? 95 : 150
  const baseSize = isMobile ? 4.2 : 5.2
  const now = Date.now() + Math.floor(Math.random() * 100000)

  return Array.from({ length: count }).map((_, index) => {
    const angle = (Math.PI * 2 * index) / count + random(-0.12, 0.12)
    const distance = random(spread * 0.35, spread)

    return {
      id: now + index,
      x,
      y,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: random(baseSize - 1, baseSize + 1.6),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: (angle * 180) / Math.PI,
      duration: random(850, 1250),
      trailLength: random(isMobile ? 10 : 12, isMobile ? 18 : 24),
      trailThickness: random(1, 1.8),
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

          .click-particle-wrap {
            position: absolute;
            left: 0;
            top: 0;
            pointer-events: none;
            animation-name: click-particle-burst;
            animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
            animation-fill-mode: forwards;
            will-change: transform, opacity;
          }

          .click-particle-dot {
            position: absolute;
            left: 0;
            top: 0;
            border-radius: 999px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            box-shadow:
              0 0 6px rgba(255,255,255,0.45),
              0 0 12px rgba(191,219,254,0.18),
              0 0 18px rgba(216,180,254,0.1);
            filter: saturate(1.05);
          }

          .click-particle-trail {
            position: absolute;
            left: 0;
            top: 0;
            transform-origin: left center;
            pointer-events: none;
            border-radius: 999px;
            opacity: 0.8;
            background: linear-gradient(
              90deg,
              rgba(255,255,255,0.0) 0%,
              rgba(255,255,255,0.08) 12%,
              var(--trail-color) 55%,
              rgba(255,255,255,0.92) 100%
            );
            filter: blur(0.2px);
          }

          @keyframes click-particle-burst {
            0% {
              opacity: 0.98;
              transform: translate3d(0, 0, 0) scale(0.92);
            }
            55% {
              opacity: 0.9;
            }
            100% {
              opacity: 0;
              transform:
                translate3d(var(--dx), var(--dy), 0)
                scale(0.42);
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
              className="click-particle-wrap"
              style={
                {
                  animationDuration: `${p.duration}ms`,
                  ["--dx" as any]: `${p.dx}px`,
                  ["--dy" as any]: `${p.dy}px`,
                } as React.CSSProperties
              }
            >
              <span
                className="click-particle-trail"
                style={
                  {
                    width: `${p.trailLength}px`,
                    height: `${p.trailThickness}px`,
                    transform: `translate(-100%, -50%) rotate(${p.rotate}deg)`,
                    ["--trail-color" as any]: p.color,
                  } as React.CSSProperties
                }
              />

              <span
                className="click-particle-dot"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: p.color,
                }}
              />
            </span>
          </span>
        ))}
      </div>
    </>
  )
}
