import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTimerOptions {
  initialSeconds: number
  onExpire?: () => void
  autoStart?: boolean
}

export function useTimer({ initialSeconds, onExpire, autoStart = true }: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)

  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])

  useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setIsRunning(false)
          onExpireRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning])

  const pause = useCallback(() => setIsRunning(false), [])
  const resume = useCallback(() => setIsRunning(true), [])
  const reset = useCallback(() => {
    setTimeLeft(initialSeconds)
    setIsRunning(autoStart)
  }, [initialSeconds, autoStart])

  const isWarning = timeLeft <= 300   // last 5 minutes
  const isDanger  = timeLeft <= 60    // last 1 minute

  return { timeLeft, isRunning, pause, resume, reset, isWarning, isDanger }
}
