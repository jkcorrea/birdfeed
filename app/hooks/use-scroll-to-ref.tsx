import { useEffect, useRef } from 'react'
import { useAnimation } from 'framer-motion'
import type { MutableRefObject } from 'react'

interface UseScrollToRefOptions {
  duration?: number
  ease?: string
}

const useScrollToRef = <E extends HTMLElement = HTMLDivElement>(
  options: UseScrollToRefOptions = { duration: 1, ease: 'easeInOut' }
): MutableRefObject<E | null> => {
  const { duration, ease } = options
  const ref = useRef<E | null>(null)
  const controls = useAnimation()

  useEffect(() => {
    const scrollToRef = async () => {
      if (ref.current) {
        const yOffset = ref.current.getBoundingClientRect().top + window.pageYOffset

        await controls.start({
          y: -yOffset,
          transition: { duration, ease },
        })

        controls.set({ y: 0 })
      }
    }

    scrollToRef()
  }, [ref, controls, duration, ease])

  return ref
}

export default useScrollToRef
