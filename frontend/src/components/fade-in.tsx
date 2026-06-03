import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'

type Props = HTMLMotionProps<'div'> & {
  children: ReactNode
  delay?: number
  className?: string
}

export const FadeIn = forwardRef<HTMLDivElement, Props>(function FadeIn(
  { children, className = '', delay = 0, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
})
