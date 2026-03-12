import { useEffect, useRef } from 'react'

export type DataChangeEvent = 'recipes-changed' | 'meal-plan-changed'

export function emitDataChange(event: DataChangeEvent) {
  window.dispatchEvent(new CustomEvent(event))
}

export function useDataChangeListener(event: DataChangeEvent, callback: () => void) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const handler = () => callbackRef.current()
    window.addEventListener(event, handler)
    return () => window.removeEventListener(event, handler)
  }, [event])
}
