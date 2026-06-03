import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'
import { useTheme } from '@/context/theme-provider'

export function ParticleField({
  density = 70,
  className,
}: {
  density?: number
  className?: string
}) {
  const [ready, setReady] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  const options = useMemo<ISourceOptions>(
    () => {
      const isDark = resolvedTheme === 'dark'
      return {
        fullScreen: { enable: false },
        background: { color: { value: 'transparent' } },
        fpsLimit: 60,
        detectRetina: true,
        particles: {
          number: { value: density, density: { enable: true, width: 1920, height: 1080 } },
          color: { value: isDark
            ? ['#a78bfa', '#67e8f9', '#818cf8', '#f0abfc']
            : ['#7c3aed', '#06b6d4', '#22d3ee', '#a78bfa']
          },
          shape: { type: 'circle' },
          opacity: {
            value: { min: isDark ? 0.25 : 0.15, max: isDark ? 0.7 : 0.5 },
            animation: { enable: true, speed: 0.4, sync: false },
          },
          size: { value: { min: 1, max: 3 } },
          move: {
            enable: true,
            speed: { min: 0.2, max: 0.7 },
            direction: 'none',
            random: true,
            straight: false,
            outModes: { default: 'out' },
          },
          links: {
            enable: true,
            distance: 130,
            color: isDark ? '#a78bfa' : '#7c3aed',
            opacity: isDark ? 0.22 : 0.15,
            width: 1,
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'grab' },
            resize: { enable: true },
          },
          modes: {
            grab: { distance: 160, links: { opacity: isDark ? 0.5 : 0.4 } },
          },
        },
      }
    },
    [density, resolvedTheme],
  )

  if (!ready) return null

  return (
    <div className={className} aria-hidden>
      <Particles id="tsparticles" options={options} className="h-full w-full" />
    </div>
  )
}
