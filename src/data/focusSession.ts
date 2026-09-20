import { useSyncExternalStore } from 'react'
import { addComment, completeTask, updateTask } from '@/data/actions'
import type { Task } from '@/domain/types'

export interface FocusSessionState {
  activeTaskId: string | null
  activeTaskTitle: string | null
  activeDay: string | null
  isRunning: boolean
  isDndActive: boolean
  minimized: boolean
  elapsedSeconds: number
  startedAt: number | null
  startHour: number | null // e.g. 14.5 for 14:30
}

const INITIAL_STATE: FocusSessionState = {
  activeTaskId: null,
  activeTaskTitle: null,
  activeDay: null,
  isRunning: false,
  isDndActive: false,
  minimized: false,
  elapsedSeconds: 0,
  startedAt: null,
  startHour: null,
}

let sessionState: FocusSessionState = { ...INITIAL_STATE }
const listeners = new Set<() => void>()

let timerInterval: number | null = null
let wakeLockSentinel: any = null

function emit() {
  listeners.forEach((l) => l())
}

export function getFocusSession(): FocusSessionState {
  return sessionState
}

export function subscribeFocusSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useFocusSession(): FocusSessionState {
  return useSyncExternalStore(subscribeFocusSession, getFocusSession, getFocusSession)
}

/** Play subtle procedural audio chime using Web Audio */
export function playFocusSound(type: 'start' | 'complete' | 'tick') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    if (type === 'start') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15) // E5
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.45)
    } else if (type === 'complete') {
      // Ascending triumphant triad: C5 - E5 - G5 - C6
      const freqs = [523.25, 659.25, 783.99, 1046.5]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        const startTime = ctx.currentTime + idx * 0.1
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0.15, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.4)
      })
    }
  } catch {
    // Audio context may be suspended or blocked; safe to ignore
  }
}

/** Request Screen WakeLock to keep screen on in DND mode */
async function acquireWakeLock() {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen')
      wakeLockSentinel?.addEventListener('release', () => {
        wakeLockSentinel = null
      })
    } catch {
      // Graceful fallback
    }
  }
}

function releaseWakeLock() {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release()
    } catch {
      // Ignore
    }
    wakeLockSentinel = null
  }
}

function startTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval)
  }

  timerInterval = window.setInterval(() => {
    if (!sessionState.isRunning) return

    sessionState = {
      ...sessionState,
      elapsedSeconds: sessionState.elapsedSeconds + 1,
    }
    emit()
  }, 1000)
}

function stopTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval)
    timerInterval = null
  }
}

/**
 * Start executing a task in "Modo No Molestar".
 * Silences distractions, engages Screen WakeLock, and counts up the actual real time dedicated.
 */
export function startExecution(task: Task, activeDay: string): void {
  const now = new Date()
  const startHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600

  // Format HH:mm for scheduledStart to anchor task in reality
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const currentStartTime = `${hh}:${mm}`

  // Move task to execution stage and anchor start time if not set
  updateTask(task.id, {
    stage: 'execution',
    status: 'in_progress',
    scheduledStart: task.scheduledStart || currentStartTime,
  })

  sessionState = {
    activeTaskId: task.id,
    activeTaskTitle: task.title,
    activeDay,
    isRunning: true,
    isDndActive: true,
    minimized: false,
    elapsedSeconds: 0,
    startedAt: Date.now(),
    startHour,
  }

  playFocusSound('start')
  acquireWakeLock()
  startTimer()
  emit()
}

export function pauseExecution(): void {
  sessionState = { ...sessionState, isRunning: false }
  emit()
}

export function resumeExecution(): void {
  sessionState = { ...sessionState, isRunning: true }
  startTimer()
  emit()
}

export function setFocusMinimized(minimized: boolean): void {
  sessionState = { ...sessionState, minimized }
  emit()
}

/**
 * Complete the active task and close No Molestar mode.
 * Records the exact real hours spent on the task.
 */
export function finishExecution(options?: { actualHours?: number; comment?: string }): ReturnType<typeof completeTask> {
  const taskId = sessionState.activeTaskId
  if (!taskId) return null

  // Calculate real hours dedicated (e.g. 45 min = 0.75h, min 0.05h / 3 minutes)
  const realHoursElapsed = Math.max(0.05, Number((sessionState.elapsedSeconds / 3600).toFixed(2)))
  const finalHours = options?.actualHours ?? realHoursElapsed

  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const currentEndTime = `${hh}:${mm}`

  stopTimer()
  releaseWakeLock()
  playFocusSound('complete')

  if (options?.comment?.trim()) {
    addComment('task', taskId, options.comment.trim())
  }

  updateTask(taskId, {
    actualHours: finalHours,
    scheduledEnd: currentEndTime,
  })

  const outcome = completeTask(taskId, {
    actualHours: finalHours,
  })

  sessionState = { ...INITIAL_STATE }
  emit()

  return outcome
}

export function cancelExecution(): void {
  const taskId = sessionState.activeTaskId
  if (taskId) {
    // Revert status to pending
    updateTask(taskId, { status: 'pending' })
  }

  stopTimer()
  releaseWakeLock()
  sessionState = { ...INITIAL_STATE }
  emit()
}
