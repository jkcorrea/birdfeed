import { useEffect, useState } from 'react'
import type { Variants } from 'framer-motion'
import { AnimatePresence, motion } from 'framer-motion'

const animationVariants: Variants = {
  // center the text
  hidden: { opacity: 0, y: 20, rotateX: -45 },
  visible: { opacity: 1, y: 0, rotateX: 0 },
  exit: { opacity: 0, y: -20, rotateX: 45 },
}
interface Props {
  words: string[]
  duration?: number
}

export function AnimatedWord({ words, duration = 5000 }: Props) {
  const word = useWordCycle(words, duration)

  return (
    <div className="relative inline-block w-[180px] whitespace-nowrap text-center sm:w-[300px]">
      <div className="absolute inset-x-0 z-0 ml-0.5 h-2 -rotate-1 rounded-full bg-accent" />
      <AnimatePresence mode="wait">
        <motion.span
          key={word}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={animationVariants}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="z-1 relative inline-block transform-gpu"
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

const useWordCycle = (words: string[], duration: number) => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, duration)

    return () => clearInterval(interval)
  }, [duration, words.length])

  return words[index]
}
