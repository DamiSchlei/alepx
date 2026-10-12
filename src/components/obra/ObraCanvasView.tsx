import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Compass,
  CalendarPlus,
  ExternalLink,
} from 'lucide-react'
import { updateArtifact, convertArtifactToTask } from '@/data/actions'
import { TERRENO_MAP } from '@/domain/terrenos'
import type { ObraArtifact, Objective, Task } from '@/domain/types'

interface ObraCanvasViewProps {
  artifacts: ObraArtifact[]
  objectives: Objective[]
  tasks: Task[]
  onAddArtifact: (position?: { x: number; y: number }) => void
  onEditArtifact: (artifact: ObraArtifact) => void
  projectColor?: string
}

export function ObraCanvasView({
  artifacts,
  objectives,
  tasks,
  onAddArtifact,
  onEditArtifact,
  projectColor = '#7a3fe0',
}: ObraCanvasViewProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 20, y: 20 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Dragging cards
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleZoomIn = () => setScale((s) => Math.min(2, s + 0.15))
  const handleZoomOut = () => setScale((s) => Math.max(0.4, s - 0.15))
  const handleResetZoom = () => {
    setScale(1)
    setPan({ x: 20, y: 20 })
  }

  // Canvas pan handlers
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    // Only pan if clicking canvas directly
    if (e.target !== containerRef.current && (e.target as HTMLElement).id !== 'canvas-surface') {
      return
    }
    setIsPanning(true)
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
    } else if (draggingCardId) {
      const card = artifacts.find((a) => a.id === draggingCardId)
      if (card && containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect()
        const newX = Math.round((e.clientX - bounds.left - pan.x) / scale - dragOffset.x)
        const newY = Math.round((e.clientY - bounds.top - pan.y) / scale - dragOffset.y)
        updateArtifact(card.id, {
          canvasPosition: { x: Math.max(10, newX), y: Math.max(10, newY) },
        })
      }
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingCardId(null)
  }

  const startCardDrag = (e: React.MouseEvent, card: ObraArtifact) => {
    e.stopPropagation()
    setDraggingCardId(card.id)
    const pos = card.canvasPosition || { x: 50, y: 50 }
    if (containerRef.current) {
      const bounds = containerRef.current.getBoundingClientRect()
      const clickXInCanvas = (e.clientX - bounds.left - pan.x) / scale
      const clickYInCanvas = (e.clientY - bounds.top - pan.y) / scale
      setDragOffset({
        x: clickXInCanvas - pos.x,
        y: clickYInCanvas - pos.y,
      })
    }
  }

  return (
    <div className="relative flex flex-col h-[520px] w-full select-none overflow-hidden rounded-2xl border border-line bg-[#f8f9fb] shadow-inner">
      {/* Canvas Tool Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-xl border border-line bg-surface/90 p-1 backdrop-blur shadow-xs">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label={t('obra.canvas.zoomIn')}
          className="flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label={t('obra.canvas.zoomOut')}
          className="flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
        >
          <ZoomOut className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          aria-label={t('obra.canvas.resetZoom')}
          className="flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>

      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAddArtifact({ x: 120, y: 120 })}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-3 py-1.5 text-[12px] font-semibold text-white shadow-xs hover:bg-violet-dark transition-all"
        >
          <Plus className="size-4" />
          <span>{t('obra.canvas.addNote')}</span>
        </button>
        <span className="hidden sm:inline text-[11px] text-ink-3">
          {t('obra.canvas.dragHint')}
        </span>
      </div>

      {/* Infinite Canvas Surface */}
      <div
        ref={containerRef}
        id="canvas-surface"
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="size-full cursor-grab active:cursor-grabbing overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
          className="relative min-w-[2000px] min-h-[1400px]"
        >
          {/* Objectives Column on Canvas */}
          <div className="absolute left-6 top-8 flex flex-col gap-3 w-[260px]">
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                {t('obra.canvas.objectivesSection')}
              </span>
              <span className="rounded-full bg-surface-2 px-1.5 text-[10px] font-semibold text-ink-3">
                {objectives.length}
              </span>
            </div>

            {objectives.map((obj, i) => {
              const objTasks = tasks.filter((t) => t.objectiveId === obj.id)
              const doneCount = objTasks.filter(
                (t) => t.status === 'done_on_time' || t.status === 'done_late',
              ).length
              return (
                <div
                  key={obj.id}
                  className="rounded-xl border border-line bg-surface p-3 shadow-xs"
                  style={{
                    borderLeftWidth: '3.5px',
                    borderLeftColor: projectColor,
                  }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                    Obj {i + 1}
                  </p>
                  <p className="text-[13px] font-bold text-ink leading-tight mt-0.5">
                    {obj.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-3">
                    <span>
                      {doneCount} / {objTasks.length} tareas
                    </span>
                    <span
                      className={`inline-block size-2 rounded-full ${
                        obj.status === 'done'
                          ? 'bg-mint'
                          : obj.status === 'in_progress'
                          ? 'bg-amber-500'
                          : 'bg-ink-3'
                      }`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Artifact Cards Floating on Canvas */}
          {artifacts.map((artifact, index) => {
            const pos = artifact.canvasPosition || {
              x: 320 + (index % 3) * 290,
              y: 40 + Math.floor(index / 3) * 220,
            }
            const terr = TERRENO_MAP[artifact.terreno] || TERRENO_MAP.literatura
            const isDragging = draggingCardId === artifact.id

            return (
              <div
                key={artifact.id}
                onMouseDown={(e) => startCardDrag(e, artifact)}
                onClick={() => onEditArtifact(artifact)}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  borderLeftWidth: '3.5px',
                  borderLeftColor: terr.color,
                }}
                className={`absolute w-[270px] cursor-pointer rounded-2xl border border-line bg-surface p-3.5 shadow-paper transition-shadow ${
                  isDragging ? 'shadow-lg ring-2 ring-violet/30' : 'hover:shadow-md'
                }`}
              >
                {/* Card Top */}
                <div className="flex items-center justify-between gap-1 pb-1">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${terr.color}15`,
                      color: terr.color,
                    }}
                  >
                    <Compass className="size-2.5" />
                    {terr.label}
                  </span>
                  <span className="text-[10px] text-ink-3">
                    {t(`obra.types.${artifact.type}`)}
                  </span>
                </div>

                {/* Title */}
                <h4
                  className={
                    artifact.terreno === 'literatura'
                      ? 'font-serif text-[14px] font-bold text-ink leading-snug mt-1'
                      : 'text-[14px] font-bold text-ink leading-snug mt-1'
                  }
                >
                  {artifact.title}
                </h4>

                {/* Content snippet */}
                {artifact.content && (
                  <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-ink/75">
                    {artifact.content}
                  </p>
                )}

                {/* Card bottom bar */}
                <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2 text-[11px] text-ink-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      convertArtifactToTask(artifact.id)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet hover:underline"
                  >
                    <CalendarPlus className="size-3" />
                    <span>Llevar a hoy</span>
                  </button>
                  {artifact.url && (
                    <a
                      href={artifact.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-ink-3 hover:text-violet"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
