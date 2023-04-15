import { useEffect, useState } from 'react'
import { throttle } from 'lodash-es'

const screens = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const
type ScreenSize = keyof typeof screens

const getDeviceConfig = (width: number): ScreenSize => {
  let breakpoint: ScreenSize = 'sm'

  for (let i = 0; i < Object.keys(screens).length; i++) {
    if (width >= screens[Object.keys(screens)[i] as ScreenSize]) {
      breakpoint = Object.keys(screens)[i] as ScreenSize
    }
  }

  return breakpoint
}

export function useTailwindBreakpoint() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 0
  const [bp, setBp] = useState(() => getDeviceConfig(width))

  useEffect(() => {
    const calcInnerWidth = throttle(() => setBp(getDeviceConfig(window.innerWidth)), 200)
    window.addEventListener('resize', calcInnerWidth)
    return () => window.removeEventListener('resize', calcInnerWidth)
  }, [width])

  return bp
}

/** Returns true if the current breakpoint is smaller than or equal to the given breakpoint */
export function useTailwindBreakpointMax(maxSize: ScreenSize) {
  const bp = useTailwindBreakpoint()
  return screens[bp] <= screens[maxSize]
}
