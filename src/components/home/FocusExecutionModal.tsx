import { useMemo } from 'react'
import {
  BellOff,
  Check,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Sparkles,
  X,
} from 'lucide-react'
import { useFeedback } from '@/app/FeedbackProvider'
import {
  cancelExecution,
  finishExecution,
  pauseExecution,
  resumeExecution,
  setFocusMinimized,
  useFocusSession,
} from '@/data/focusSession'
import { blockContext } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { TERRENO_MAP } from '@/domain/terrenos'

function formatStopwatch(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function FocusExecutionModal() {
  const session = useFocusSession()
  const state = useAleph()
  const feedback = useFeedback()

  const task = useMemo(() => {
    if (!session.activeTaskId) return null
    return state.tasks.find((t) => t.id === session.activeTaskId) ?? null
  }, [session.activeTaskId, state.tasks])

  const ctx = useMemo(() => {
    if (!task) return null
    return blockContext(state, task)
  }, [state, task])

  if (!session.activeTaskId || !task) {
    return null
  }

  const projectColor = ctx?.projectColor || '#7a3fe0'
  const terrenoInfo = TERRENO_MAP[ctx?.terreno ?? 'literatura']

  // Seconds into current minute for smooth breathing pulse of the dial
  const ringSeconds = session.elapsedSeconds % 60
  const ringRatio = ringSeconds / 60

  const handleComplete = () => {
    const outcome = finishExecution()
    if (outcome) {
      feedback.celebrate(outcome)
    }
  }

  // If minimized: render floating focus pill at bottom
  if (session.minimized) {
    return (
      <aside
        aria-label="Sesión de enfoque minimizada"
        className="fixed bottom-[calc(var(--tab-bar-height,64px)+12px)] left-4 right-4 z-40 mx-auto max-w-md animate-fadeIn"
      >
        <div
          className="flex items-center justify-between gap-2.5 rounded-[18px] border border-white/10 bg-[#12141a]/95 px-4 py-3 text-white shadow-xl backdrop-blur-md"
          style={{ boxShadow: `0 8px 30px ${projectColor}30` }}
        >
          <div
            onClick={() => setFocusMinimized(false)}
            className="flex flex-1 min-w-0 items-center gap-2.5 cursor-pointer"
          >
            <div
              className="flex size-7 items-center justify-center rounded-full shrink-0"
              style={{ backgroundColor: `${projectColor}30`, color: projectColor }}
            >
              <BellOff className="size-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-bold truncate leading-tight">
                {task.title}
              </span>
              <span className="text-[11px] font-medium text-white/60 tabular-nums">
                🔕 No Molestar • {formatStopwatch(session.elapsedSeconds)} dedicados
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={session.isRunning ? pauseExecution : resumeExecution}
              className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
              title={session.isRunning ? 'Pausar' : 'Reanudar'}
            >
              {session.isRunning ? (
                <Pause className="size-3.5 fill-current" />
              ) : (
                <Play className="size-3.5 fill-current ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleComplete}
              className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-xs"
              title="Cumplir y guardar tiempo real"
            >
              <Check className="size-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => setFocusMinimized(false)}
              className="flex size-8 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/15 active:scale-95 transition-all"
              title="Expandir"
            >
              <Maximize2 className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>
    )
  }

  // Full Screen / Immersive Focus Modal
  const ringSize = 220
  const strokeWidth = 8
  const center = ringSize / 2
  const radius = center - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - ringRatio)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn">
      <div
        className="relative flex w-full max-w-sm flex-col items-center rounded-[28px] border border-white/10 bg-[#111318] p-6 text-white shadow-2xl overflow-hidden"
        style={{
          boxShadow: `0 20px 60px ${projectColor}25, 0 0 0 1px rgba(255,255,255,0.08)`,
        }}
      >
        {/* Subtle decorative glow in the background */}
        <div
          className="pointer-events-none absolute -top-24 size-64 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: projectColor }}
        />

        {/* Top Header Actions */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/90">
            <BellOff className="size-3.5 text-amber-400" />
            <span>No Molestar Activo</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFocusMinimized(true)}
              className="flex size-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-all"
              title="Minimizar"
            >
              <Minimize2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={cancelExecution}
              className="flex size-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-all"
              title="Cancelar sesión"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Realism Notice */}
        <p className="mt-3 text-center text-[12px] font-medium text-white/60">
          Sin límite de tiempo rígido. Dedicale lo que realmente necesites.
        </p>

        {/* Big Circular Stopwatch Dial */}
        <div className="relative my-6 flex items-center justify-center">
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#212631"
              strokeWidth={strokeWidth}
            />
            {/* Real elapsed ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={projectColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center text in ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-[38px] font-black tracking-tight tabular-nums font-mono leading-none">
              {formatStopwatch(session.elapsedSeconds)}
            </span>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">
              {session.isRunning ? 'Tiempo dedicado' : 'En pausa'}
            </span>
            <span className="text-[11px] font-medium text-white/40 mt-0.5">
              Acercándonos a la realidad
            </span>
          </div>
        </div>

        {/* Task Details Card */}
        <div className="w-full rounded-[16px] bg-white/5 border border-white/10 p-3.5 mb-6 text-left">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: projectColor }}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
              {ctx?.project?.name ?? ctx?.result?.name ?? 'Proyecto'}
            </span>
            {ctx?.terreno && (
              <span
                className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${terrenoInfo.color}25`,
                  color: terrenoInfo.color,
                }}
              >
                {terrenoInfo.label}
              </span>
            )}
          </div>
          <h3 className="text-[14px] font-bold text-white leading-snug line-clamp-2">
            {task.title}
          </h3>
        </div>

        {/* Main Action Buttons */}
        <div className="flex w-full items-center gap-3">
          <button
            type="button"
            onClick={session.isRunning ? pauseExecution : resumeExecution}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 font-semibold text-white hover:bg-white/20 active:scale-98 transition-all"
          >
            {session.isRunning ? (
              <>
                <Pause className="size-4 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="size-4 fill-current ml-0.5" />
                <span>Reanudar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleComplete}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 active:scale-98 transition-all"
          >
            <Sparkles className="size-4" />
            <span>Cumplir tarea</span>
          </button>
        </div>
      </div>
    </div>
  )
}
