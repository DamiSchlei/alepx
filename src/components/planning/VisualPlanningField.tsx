import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Compass,
  Target,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Calendar,
  Edit2,
  Trash2,
  SlidersHorizontal,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/primitives'
import { completeTask, createTask, createObjective, reopenTask } from '@/data/actions'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { activeObjectivesOfResult, tasksOfObjective, tasksOfResult } from '@/data/selectors'
import type { Project, Result, Task } from '@/domain/types'
import { PlanningPhilosophyModal } from './PlanningPhilosophyModal'

interface VisualPlanningFieldProps {
  project: Project
  results: Result[]
  currentDay: string
  onNewResult: (projectName: string) => void
  onNewObjective: (result: Result) => void
  onNewTask: (resultId?: string, objectiveId?: string) => void
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  onOpenTacticalTask?: (taskId: string) => void
  onZoomResult?: (result: Result) => void
}

export function VisualPlanningField({
  project,
  results,
  currentDay,
  onNewResult,
  onNewObjective,
  onNewTask,
  onEditProject,
  onDeleteProject,
  onOpenTacticalTask,
  onZoomResult,
}: VisualPlanningFieldProps) {
  const { t } = useTranslation()
  const state = useAleph()

  const [showPhilosophy, setShowPhilosophy] = useState(false)
  const [collapsedResults, setCollapsedResults] = useState<Set<string>>(new Set())
  const [collapsedObjectives, setCollapsedObjectives] = useState<Set<string>>(new Set())

  // Quick step naming state
  const [quickStepText, setQuickStepText] = useState('')
  const [quickStepKind, setQuickStepKind] = useState<'task_today' | 'task_loose' | 'objective'>('task_today')
  const [quickStepTargetResultId, setQuickStepTargetResultId] = useState<string>(results[0]?.id || '')

  // Inline step adding per node
  const [activeInlineAddObjectiveResId, setActiveInlineAddObjectiveResId] = useState<string | null>(null)
  const [inlineObjectiveName, setInlineObjectiveName] = useState('')
  const [activeInlineAddTaskObjId, setActiveInlineAddTaskObjId] = useState<string | null>(null)
  const [inlineTaskTitle, setInlineTaskTitle] = useState('')

  const accentColor = project.color || '#7a3fe0'

  // Calculate project aggregate statistics
  const resultIds = new Set(results.map((r) => r.id))
  const allProjectTasks = state.tasks.filter((task) => task.resultId && resultIds.has(task.resultId))
  const completedTasks = allProjectTasks.filter((t) => isTaskDone(t.status))
  const totalTasks = allProjectTasks.length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  const toggleResultCollapse = (id: string) => {
    setCollapsedResults((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleObjectiveCollapse = (id: string) => {
    setCollapsedObjectives((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleTask = (task: Task) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
    } else {
      completeTask(task.id)
    }
  }

  // Handle rapid free-form step naming
  const handleQuickStepSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = quickStepText.trim()
    if (!trimmed) return

    const targetResId = quickStepTargetResultId || results[0]?.id
    if (!targetResId && quickStepKind !== 'objective') {
      onNewTask()
      return
    }

    if (quickStepKind === 'task_today') {
      createTask({
        title: trimmed,
        terreno: 'literatura',
        stage: 'execution',
        estimatedHours: 1,
        scheduledFor: currentDay,
        dueAt: currentDay,
        resultId: targetResId,
      })
    } else if (quickStepKind === 'task_loose') {
      createTask({
        title: trimmed,
        terreno: 'literatura',
        stage: 'research',
        estimatedHours: 1,
        resultId: targetResId,
      })
    } else if (quickStepKind === 'objective' && targetResId) {
      createObjective({
        resultId: targetResId,
        name: trimmed,
      })
    }

    setQuickStepText('')
  }

  // Handle inline objective creation under a result
  const handleInlineObjectiveCreate = (resultId: string) => {
    const trimmed = inlineObjectiveName.trim()
    if (!trimmed) return
    createObjective({
      resultId,
      name: trimmed,
    })
    setInlineObjectiveName('')
    setActiveInlineAddObjectiveResId(null)
  }

  // Handle inline base task creation under an objective
  const handleInlineTaskCreate = (resultId: string, objectiveId: string) => {
    const trimmed = inlineTaskTitle.trim()
    if (!trimmed) return
    createTask({
      title: trimmed,
      terreno: 'empresa',
      stage: 'execution',
      estimatedHours: 1,
      scheduledFor: currentDay,
      dueAt: currentDay,
      resultId,
      objectiveId,
    })
    setInlineTaskTitle('')
    setActiveInlineAddTaskObjId(null)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-2 sm:px-4 pb-24">
      {/* 1. TEACHING & PHILOSOPHY CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-purple-500/5 via-accent/5 to-transparent p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-xs">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  Campo de Planificación Viva
                </span>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  Estructura fluida
                </span>
              </div>
              <p className="mt-1 text-[13px] text-ink-2 leading-relaxed">
                Decidir un <strong>resultado futuro más allá de tu realidad actual</strong> crea la
                dirección. Los <strong>objetivos</strong> son los 'a dóndes' necesarios, y las{' '}
                <strong>tareas de base</strong> son el entrenamiento diario que materializa la obra.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPhilosophy(true)}
            className="flex items-center gap-1.5 self-start sm:self-center shrink-0 rounded-full border border-accent/30 bg-white px-3.5 py-1.5 text-[12px] font-bold text-accent hover:bg-accent/5 active:scale-95 transition-all shadow-2xs"
          >
            <BookOpen className="size-3.5" />
            <span>¿Por qué planificar?</span>
          </button>
        </div>
      </div>

      {/* 2. RAPID FREE-FORM STEP NAMING ("ir nombrando esos pasos sin ser una estructura fija") */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-paper">
        <form onSubmit={handleQuickStepSubmit} className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[12px] font-bold text-ink flex items-center gap-1.5">
              <span>Nombrar un paso libremente en este campo</span>
              <span className="text-[10px] font-normal text-ink-3">
                (sin fricción burocrática)
              </span>
            </label>
            {results.length > 1 && (
              <select
                value={quickStepTargetResultId}
                onChange={(e) => setQuickStepTargetResultId(e.target.value)}
                className="text-[11px] font-semibold text-ink-2 bg-subtle border border-line/60 rounded-lg px-2 py-0.5 outline-none"
              >
                {results.map((r) => (
                  <option key={r.id} value={r.id}>
                    Hacia: {r.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={quickStepText}
              onChange={(e) => setQuickStepText(e.target.value)}
              placeholder="Escribí aquí el paso que imaginás para tu obra y presioná Enter…"
              className="flex-1 rounded-xl border border-line bg-surface px-3.5 py-2 text-[13px] text-ink placeholder:text-ink-3 focus:border-accent focus:bg-white focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!quickStepText.trim()}
              className="flex items-center gap-1 rounded-xl bg-accent px-4 py-2 text-[13px] font-bold text-white shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all"
            >
              <Plus className="size-4" />
              <span>Sembrar</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[11px] text-ink-3">Definir como:</span>
            <button
              type="button"
              onClick={() => setQuickStepKind('task_today')}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                quickStepKind === 'task_today'
                  ? 'bg-purple-100 font-bold text-purple-700 ring-1 ring-purple-300'
                  : 'bg-subtle text-ink-3 hover:text-ink'
              }`}
            >
              ⚡ Tarea de base para hoy
            </button>
            <button
              type="button"
              onClick={() => setQuickStepKind('task_loose')}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                quickStepKind === 'task_loose'
                  ? 'bg-blue-100 font-bold text-blue-700 ring-1 ring-blue-300'
                  : 'bg-subtle text-ink-3 hover:text-ink'
              }`}
            >
              📅 Tarea abierta en backlog
            </button>
            {results.length > 0 && (
              <button
                type="button"
                onClick={() => setQuickStepKind('objective')}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                  quickStepKind === 'objective'
                    ? 'bg-emerald-100 font-bold text-emerald-700 ring-1 ring-emerald-300'
                    : 'bg-subtle text-ink-3 hover:text-ink'
                }`}
              >
                🎯 Objetivo ('A dónde')
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. ORGANIC VISUAL TREE CONTAINER */}
      <div className="relative flex flex-col rounded-3xl border border-line bg-white shadow-paper overflow-hidden">
        {/* TREE ROOT: PROJECT NODE */}
        <div
          className="relative p-5 border-b border-line/60"
          style={{
            background: `linear-gradient(to right, ${accentColor}18 0%, #ffffff 50%)`,
            borderLeft: `6px solid ${accentColor}`,
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs"
                  style={{ backgroundColor: accentColor }}
                >
                  {t('common.project')} · Raíz
                </span>
                <span className="text-[12px] font-medium text-ink-3">
                  {results.length} {t('common.result')} · {totalTasks} tareas ({completedTasks.length} listas)
                </span>
              </div>
              <h2 className="mt-1 text-[22px] font-extrabold text-ink leading-tight">
                {project.name}
              </h2>
              {project.description && (
                <p className="mt-1 text-[13px] text-ink-2 max-w-xl leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>

            {/* Project action buttons: Edit, Delete, New Result */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onEditProject(project)}
                className="flex items-center gap-1 rounded-xl border border-line bg-white/80 px-2.5 py-1.5 text-[12px] font-medium text-ink-2 hover:border-accent hover:text-accent active:scale-95 transition-all shadow-2xs"
                title="Editar nombre, visión o color del proyecto"
              >
                <Edit2 className="size-3.5" />
                <span className="hidden sm:inline">{t('common.edit')}</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteProject(project)}
                className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50/70 px-2.5 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-100 hover:text-red-700 active:scale-95 transition-all shadow-2xs"
                title="Eliminar este proyecto"
              >
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">Borrar</span>
              </button>
              <button
                type="button"
                onClick={() => onNewResult(project.name)}
                className="flex items-center gap-1 rounded-xl bg-accent px-3 py-1.5 text-[12px] font-bold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus className="size-3.5" />
                <span>Nuevo Resultado</span>
              </button>
            </div>
          </div>

          {/* Project progress track */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: accentColor,
                }}
              />
            </div>
            <span className="text-[12px] font-bold text-ink-2 shrink-0">
              {progressPercent}% de avance
            </span>
          </div>
        </div>

        {/* TREE BRANCHES: RESULTS → OBJECTIVES → TASKS */}
        <div className="p-4 sm:p-6 flex flex-col gap-6 bg-slate-50/30">
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-purple-50 text-accent mb-3">
                <Compass className="size-6" />
              </div>
              <h3 className="text-[16px] font-bold text-ink">
                Decidí tu primer resultado en este proyecto
              </h3>
              <p className="mt-1 text-[13px] text-ink-3 max-w-md mx-auto leading-relaxed">
                Un resultado es la concreción deseada que va más allá de tu realidad actual hoy.
                Definilo para que comience a traccionar tu planificación.
              </p>
              <div className="mt-4 flex justify-center">
                <Button onClick={() => onNewResult(project.name)}>
                  <Plus className="size-4 mr-1" />
                  <span>Definir primer resultado</span>
                </Button>
              </div>
            </div>
          ) : (
            results.map((result, rIdx) => {
              const isCollapsed = collapsedResults.has(result.id)
              const objectives = activeObjectivesOfResult(state, result.id)
              const directTasks = tasksOfResult(state, result.id).filter((t) => !t.objectiveId)

              return (
                <div
                  key={result.id}
                  className="relative flex flex-col rounded-2xl border border-line bg-white shadow-paper transition-all"
                >
                  {/* RESULT HEADER NODE */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 sm:p-4 border-b border-line/50 bg-gradient-to-r from-purple-50/60 to-white rounded-t-2xl">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleResultCollapse(result.id)}
                        className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-subtle transition-colors"
                        title={isCollapsed ? 'Desplegar rama' : 'Contraer rama'}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>

                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent font-bold text-[12px]">
                        R{rIdx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                            Resultado Deseado
                          </span>
                          {result.targetDate && (
                            <span className="text-[10px] text-ink-3 flex items-center gap-0.5">
                              <Calendar className="size-3" />
                              <span>{result.targetDate}</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-[16px] font-bold text-ink truncate">
                          {result.name}
                        </h3>
                        {result.why && (
                          <p className="text-[11px] text-ink-3 truncate italic">
                            "{result.why}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Result actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onZoomResult && (
                        <button
                          type="button"
                          onClick={() => onZoomResult(result)}
                          className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-ink-2 hover:border-accent hover:text-accent active:scale-95 transition-all"
                          title="Ver zoom detallado"
                        >
                          <span>Zoom</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (activeInlineAddObjectiveResId === result.id) {
                            onNewObjective(result)
                          } else {
                            setActiveInlineAddObjectiveResId(result.id)
                          }
                        }}
                        className="flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 active:scale-95 transition-all"
                        title="Agregar un objetivo / 'a dónde' intermedio"
                      >
                        <Plus className="size-3" />
                        <span>Objetivo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNewTask(result.id)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all"
                        title="Agregar una tarea de base directa"
                      >
                        <Plus className="size-3" />
                        <span>Tarea</span>
                      </button>
                    </div>
                  </div>

                  {/* BRANCH INTERNALS (OBJECTIVES & TASKS) */}
                  {!isCollapsed && (
                    <div className="p-4 sm:p-5 flex flex-col gap-4">
                      {/* INLINE OBJECTIVE CREATOR (IF OPEN) */}
                      {activeInlineAddObjectiveResId === result.id && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 animate-in fade-in zoom-in-95">
                          <label className="text-[11px] font-bold text-blue-900 block mb-1">
                            🎯 Nombrar Objetivo Intermedio (El 'A Dónde' necesario):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={inlineObjectiveName}
                              onChange={(e) => setInlineObjectiveName(e.target.value)}
                              placeholder="Ej: Catálogo impreso y listo para distribución…"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineObjectiveCreate(result.id)
                              }}
                              className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-[13px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleInlineObjectiveCreate(result.id)}
                              disabled={!inlineObjectiveName.trim()}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveInlineAddObjectiveResId(null)
                                setInlineObjectiveName('')
                              }}
                              className="rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] text-ink-3 hover:text-ink"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* OBJECTIVES LIST */}
                      {objectives.length === 0 && directTasks.length === 0 && (
                        <div className="rounded-xl border border-dashed border-line/80 bg-surface/30 p-4 text-center">
                          <p className="text-[13px] text-ink-3">
                            Este resultado aún no tiene objetivos ni tareas.
                          </p>
                          <p className="mt-1 text-[11px] text-ink-3">
                            Podés definir un objetivo intermedio o sumar una tarea de base con los botones de arriba.
                          </p>
                        </div>
                      )}

                      {/* Render Objectives */}
                      {objectives.map((obj) => {
                        const objTasks = tasksOfObjective(state, obj.id)
                        const isObjCollapsed = collapsedObjectives.has(obj.id)
                        const objCompletedTasks = objTasks.filter((t) => isTaskDone(t.status))

                        return (
                          <div
                            key={obj.id}
                            className="relative flex flex-col rounded-xl border border-line/80 bg-surface/30 pl-3 sm:pl-4 transition-all"
                            style={{ borderLeft: '4px solid #2563eb' }}
                          >
                            {/* OBJECTIVE HEADER */}
                            <div className="flex flex-wrap items-center justify-between gap-2 p-3 pr-4">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => toggleObjectiveCollapse(obj.id)}
                                  className="p-0.5 text-ink-3 hover:text-ink"
                                >
                                  {isObjCollapsed ? (
                                    <ChevronRight className="size-3.5" />
                                  ) : (
                                    <ChevronDown className="size-3.5" />
                                  )}
                                </button>
                                <Target className="size-4 shrink-0 text-blue-600" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                                      Objetivo · A dónde
                                    </span>
                                    <span className="text-[10px] text-ink-3">
                                      ({objCompletedTasks.length}/{objTasks.length} tareas)
                                    </span>
                                  </div>
                                  <h4 className="text-[14px] font-bold text-ink truncate mt-0.5">
                                    {obj.name}
                                  </h4>
                                  {obj.doneWhen && (
                                    <p className="text-[11px] text-ink-3 truncate">
                                      Listo cuando: {obj.doneWhen}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setActiveInlineAddTaskObjId(obj.id)}
                                className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all shadow-2xs"
                              >
                                <Plus className="size-3" />
                                <span>Tarea de base</span>
                              </button>
                            </div>

                            {/* INLINE TASK CREATOR (IF OPEN) */}
                            {activeInlineAddTaskObjId === obj.id && (
                              <div className="m-3 mt-0 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 animate-in fade-in zoom-in-95">
                                <label className="text-[11px] font-bold text-emerald-900 block mb-1">
                                  ⚡ Nombrar Tarea de Base (Unidad diaria de ejecución):
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={inlineTaskTitle}
                                    onChange={(e) => setInlineTaskTitle(e.target.value)}
                                    placeholder="Ej: Redactar primeros 3 párrafos de la propuesta…"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleInlineTaskCreate(result.id, obj.id)
                                    }}
                                    className="flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[13px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleInlineTaskCreate(result.id, obj.id)}
                                    disabled={!inlineTaskTitle.trim()}
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40"
                                  >
                                    Sumar hoy
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveInlineAddTaskObjId(null)
                                      setInlineTaskTitle('')
                                    }}
                                    className="rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] text-ink-3 hover:text-ink"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* OBJECTIVE TASKS */}
                            {!isObjCollapsed && (
                              <div className="flex flex-col gap-1.5 p-3 pt-0 pr-4">
                                {objTasks.length === 0 ? (
                                  <p className="text-[11px] text-ink-3 italic py-1">
                                    Sin tareas aún. Agregá la primera tarea de base para este objetivo.
                                  </p>
                                ) : (
                                  objTasks.map((t) => {
                                    const done = isTaskDone(t.status)
                                    return (
                                      <div
                                        key={t.id}
                                        className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                                          done
                                            ? 'border-emerald-200 bg-emerald-50/40 text-ink-3'
                                            : 'border-line/70 bg-white text-ink hover:border-line'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleTask(t)}
                                            className="shrink-0 text-emerald-600 hover:scale-110 active:scale-95 transition-transform"
                                          >
                                            {done ? (
                                              <CheckCircle2 className="size-4 fill-emerald-600 text-white" />
                                            ) : (
                                              <Circle className="size-4 text-ink-3" />
                                            )}
                                          </button>
                                          <span
                                            className={`text-[13px] truncate ${
                                              done ? 'line-through text-ink-3' : 'font-medium text-ink'
                                            }`}
                                          >
                                            {t.title}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                                          {t.scheduledFor && (
                                            <span className="rounded-md bg-subtle px-1.5 py-0.5 text-ink-3 font-medium">
                                              {t.scheduledFor === currentDay ? 'Hoy' : t.scheduledFor}
                                            </span>
                                          )}
                                          <span className="text-ink-3">
                                            {t.estimatedHours}h
                                          </span>
                                          {onOpenTacticalTask && (
                                            <button
                                              type="button"
                                              onClick={() => onOpenTacticalTask(t.id)}
                                              className="p-1 text-ink-3 hover:text-accent"
                                              title="Ver táctica de la tarea"
                                            >
                                              <SlidersHorizontal className="size-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* DIRECT RESULT TASKS (TASKS WITHOUT AN OBJECTIVE) */}
                      {directTasks.length > 0 && (
                        <div className="flex flex-col gap-1.5 pt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                            Tareas directas del resultado:
                          </span>
                          {directTasks.map((t) => {
                            const done = isTaskDone(t.status)
                            return (
                              <div
                                key={t.id}
                                className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                                  done
                                    ? 'border-emerald-200 bg-emerald-50/40 text-ink-3'
                                    : 'border-line/70 bg-white text-ink hover:border-line'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTask(t)}
                                    className="shrink-0 text-emerald-600 hover:scale-110 active:scale-95 transition-transform"
                                  >
                                    {done ? (
                                      <CheckCircle2 className="size-4 fill-emerald-600 text-white" />
                                    ) : (
                                      <Circle className="size-4 text-ink-3" />
                                    )}
                                  </button>
                                  <span
                                    className={`text-[13px] truncate ${
                                      done ? 'line-through text-ink-3' : 'font-medium text-ink'
                                    }`}
                                  >
                                    {t.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                                  {t.scheduledFor && (
                                    <span className="rounded-md bg-subtle px-1.5 py-0.5 text-ink-3 font-medium">
                                      {t.scheduledFor === currentDay ? 'Hoy' : t.scheduledFor}
                                    </span>
                                  )}
                                  <span className="text-ink-3">
                                    {t.estimatedHours}h
                                  </span>
                                  {onOpenTacticalTask && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenTacticalTask(t.id)}
                                      className="p-1 text-ink-3 hover:text-accent"
                                      title="Ver táctica"
                                    >
                                      <SlidersHorizontal className="size-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* PHILOSOPHY MODAL */}
      <PlanningPhilosophyModal
        open={showPhilosophy}
        onClose={() => setShowPhilosophy(false)}
      />
    </div>
  )
}
