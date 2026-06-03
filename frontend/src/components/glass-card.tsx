import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'

type Props = HTMLMotionProps<'div'> & {
  children: ReactNode
  delay?: number
  className?: string
}

export const GlassCard = forwardRef<HTMLDivElement, Props>(function GlassCard(
  { children, className = '', delay = 0, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={
        'rounded-3xl border border-white/40 bg-white/60 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl backdrop-saturate-150 ' +
        'dark:border-white/10 dark:bg-white/5 ' +
        className
      }
      {...rest}
    >
      {children}
    </motion.div>
  )
})
