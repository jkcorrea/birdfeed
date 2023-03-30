import { useCallback, useRef, useState } from 'react'

import { useInterval } from '~/lib/hooks'

const INTERVAL_FREQUENCY = 100

interface MockProgressReturnType {
  progress: number
  start: () => void
  finish: () => void
}

export function useMockProgress(
  /** Milliseconds. Determines how fast progress fills up. Will take about 2 * timeConstant to get to near 100%.
   *
   * For example, with a timeConstant of 10_000 ms:
   *  - after 10 seconds, progress will be about 0.6321 ( = 1-Math.exp(-1) )
   *  - after 20 seconds, progress will be about 0.8647 ( = 1-Math.exp(-2) )
   *
   * @default 1_000
   */
  timeConstant = 1000,
  onProgress?: (progress: number) => void
): MockProgressReturnType {
  const [progress, setProgress] = useState<number>(0) // progress value
  const shouldProgress = useRef(false) // manage start, finish progress callbacks
  const _time = useRef<number>(0) // track total elapsed time since .start()

  const [freq, setFreq] = useState<null | number>(null)

  // create interval to update progress
  useInterval(() => {
    if (shouldProgress.current) {
      _time.current += INTERVAL_FREQUENCY
      const newProgress = 1 - Math.exp(-_time.current / timeConstant)
      setProgress(newProgress)
      onProgress?.(newProgress)
    }
  }, freq)

  // complete progress and clear interval
  const finish = useCallback(() => {
    setProgress(1)
    setFreq(null)
    shouldProgress.current = false
  }, [])

  // start progress
  const start = useCallback(() => {
    setProgress(0)
    setFreq(INTERVAL_FREQUENCY)
    _time.current = 0
    shouldProgress.current = true
  }, [])

  return { progress, start, finish }
}
