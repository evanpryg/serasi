/**
 * Primitif animasi Serasi (motion/react).
 * Token gerak: masuk memakai ease-out lembut, keluar lebih cepat, pegas untuk elemen interaktif.
 * Semua animasi mengikuti preferensi sistem "kurangi gerakan" (MotionConfig reducedMotion="user").
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  animate,
  m,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from 'motion/react'

export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const SPRING = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 } as const
export const SPRING_SOFT = { type: 'spring', stiffness: 160, damping: 24 } as const

export const DURATION = { fast: 0.18, base: 0.35, slow: 0.7 } as const

const loadFeatures = () => import('./features').then((mod) => mod.default)

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: DURATION.base, ease: EASE_OUT }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
}

export const staggerContainer = (stagger = 0.07, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
})

/** Muncul halus saat masuk viewport (sekali). */
export function Reveal({ children, delay = 0, y = 16, className, ...rest }: HTMLMotionProps<'div'> & { delay?: number; y?: number }) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay }}
      {...rest}
    >
      {children}
    </m.div>
  )
}

/** Kontainer stagger: anak memakai <StaggerItem>. */
export function Stagger({ children, className, stagger = 0.07, delay = 0, inView = true, as = 'div' }: { children: ReactNode; className?: string; stagger?: number; delay?: number; inView?: boolean; as?: 'div' | 'ul' | 'ol' }) {
  const Comp = as === 'ul' ? m.ul : as === 'ol' ? m.ol : m.div
  return (
    <Comp
      className={className}
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      {...(inView ? { whileInView: 'show', viewport: { once: true, margin: '0px 0px -10% 0px' } } : { animate: 'show' })}
    >
      {children}
    </Comp>
  )
}

export function StaggerItem({ children, className, as = 'div', ...rest }: HTMLMotionProps<'div'> & { as?: 'div' | 'li' }) {
  const Comp = as === 'li' ? m.li : m.div
  return (
    <Comp className={className} variants={fadeUp} {...(rest as object)}>
      {children}
    </Comp>
  )
}

/** Angka yang "menghitung naik" saat terlihat. Nilai akhir selalu akurat dan dibacakan apa adanya. */
export function CountUp({ value, format, className, duration = 1.1 }: { value: number; format: (n: number) => string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(() => (reduce ? value : 0))
  const prev = useRef(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    prev.current = value
    return () => controls.stop()
  }, [inView, value, reduce, duration])

  return (
    <span ref={ref} className={className}>
      <span aria-hidden>{format(display)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}

/** Melayang pelan (dekoratif). Mati otomatis saat reduced motion. */
export function Float({ children, className, amplitude = 8, duration = 6, delay = 0 }: { children: ReactNode; className?: string; amplitude?: number; duration?: number; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <m.div
      className={className}
      animate={reduce ? undefined : { y: [0, -amplitude, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </m.div>
  )
}

export { m, AnimatePresence }
