import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Target,
  Layers,
  CheckCircle2,
  Calendar,
  Edit2,
} from 'lucide-react'
import { TaskRow } from '@/components/task/TaskRow'
import { Button } from '@/components/ui/primitives'
import { completeTask, reopenTask } from '@/data/actions'
import {
  activeObjectivesOfResult,
  resultProgress,
  tasksOfObjective,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { formatDate } from '@/i18n/format'
import type { Project, Result, Task } from '@/domain/types'

interface ProjectHierarchyViewProps {
  project: Project
  results: Result[]
  onNewResult: (projectName: string) => void
  onNewObjective: (result: Result) => void
  onNewTask: (resultId: string, objectiveId?: string) => void
  onEditProject: (project: Project) => void
}

export function ProjectHierarchyView({
  project,
  results,
  onNewResult,
  onNewObjective,
  onNewTask,
  onEditProject,
}: ProjectHierarchyViewProps) {
  const state = useAleph()
  const locale = state.character.locale

  // Track expanded results and objectives (all expanded by default for full visibility)
  const [collapsedResultIds, setCollapsedResultIds] = useState<Set<string>>(new Set())
  const [collapsedObjectiveIds, setCollapsedObjectiveIds] = useState<Set<string>>(new Set())

  const toggleResult = (id: string) => {
    setCollapsedResultIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleObjective = (id: string) => {
    setCollapsedObjectiveIds((prev) => {
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

  // Calculate project-wide totals
  const allObjectives = results.flatMap((r) => activeObjectivesOfResult(state, r.id))
  const resultIds = new Set(results.map((r) => r.id))
  const allTasks = state.tasks.filter((t) => t.resultId && resultIds.has(t.resultId))
  const completedTasks = allTasks.filter(
    (t) => t.status === 'done_on_time' || t.status === 'done_late',
  )
  const overallRatio =
    allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0

  const accentColor = project.color || '#7a3fe0'

  return (
    <div className="flex flex-col gap-4">
      {/* PROJECT BANNER / HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-4.5 shadow-paper">
        <div
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: accentColor }}
        />
        <div className="flex items-start justify-between gap-3 pl-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: accentColor }}
              >
                Proyecto
              </span>
              <button
                type="button"
                onClick={() => onEditProject(project)}
                className="flex items-center gap-1 rounded-lg border border-line/70 bg-surface/70 px-2 py-0.5 text-[11px] font-medium text-ink-2 hover:bg-white hover:border-accent/60 hover:text-accent transition-all cursor-pointer"
              >
                <Edit2 className="size-3" />
                <span>Editar Proyecto</span>
              </button>
            </div>
            <h2 className="mt-1.5 text-[20px] font-bold text-ink leading-tight">
              {project.name}
            </h2>
            {project.description && (
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                {project.description}
              </p>
            )}
          </div>

          <Button
            onClick={() => onNewResult(project.name)}
            className="shrink-0 flex items-center gap-1.5 shadow-sm text-[13px] px-3 py-1.5"
          >
            <Plus className="size-4" />
            <span>Nuevo Resultado</span>
          </Button>
        </div>

        {/* METRICS ROW */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line/60 pt-3 pl-1 text-[12px] text-ink-3">
          <div className="flex items-center gap-1.5">
            <Layers className="size-4 text-ink-2" />
            <span>
              <strong className="text-ink font-semibold">{results.length}</strong>{' '}
              {results.length === 1 ? 'resultado producido' : 'resultados producidos'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="size-4 text-ink-2" />
            <span>
              <strong className="text-ink font-semibold">{allObjectives.length}</strong>{' '}
              {allObjectives.length === 1 ? 'objetivo' : 'objetivos'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>
              <strong className="text-ink font-semibold">{completedTasks.length}</strong> de{' '}
              {allTasks.length} pasos ({overallRatio}%)
            </span>
          </div>
        </div>
      </div>

      {/* RESULTS LIST IN THIS PROJECT */}
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/40 p-8 text-center">
          <div
            className="flex size-12 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <Layers className="size-6" />
          </div>
          <h3 className="mt-3 text-[16px] font-bold text-ink">
            No hay resultados definidos en este proyecto
          </h3>
          <p className="mt-1 max-w-sm text-[13px] text-ink-3">
            Define el primer fruto u obra concreta que nacerá dentro de {project.name}.
          </p>
          <Button
            onClick={() => onNewResult(project.name)}
            className="mt-4 flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>Definir Primer Resultado</span>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {results.map((result) => {
            const isCollapsed = collapsedResultIds.has(result.id)
            const objectives = activeObjectivesOfResult(state, result.id)
            const progress = resultProgress(state, result.id)
            const ratioPercent =
              progress.ratio !== null ? Math.round(progress.ratio * 100) : 0

            return (
              <div
                key={result.id}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs transition-shadow hover:shadow-paper"
              >
                {/* RESULT HEADER */}
                <div className="relative border-b border-line/40 bg-surface/30 p-3.5 pl-4">
                  <div
                    className="absolute inset-y-0 left-0 w-1 bg-[#9aa0ae]"
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                          Resultado producido
                        </span>
                        {result.targetDate && (
                          <span className="flex items-center gap-1 text-[11px] text-ink-3">
                            <Calendar className="size-3" />
                            {formatDate(result.targetDate, locale)}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/planning/results/${result.id}`}
                        className="mt-0.5 block text-[16px] font-bold text-ink hover:text-accent transition-colors"
                      >
                        {result.name}
                      </Link>

                      {result.why && (
                        <p className="mt-0.5 text-[12px] text-ink-3 line-clamp-1 italic">
                          "{result.why}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        className="text-[12px] px-2.5 py-1 flex items-center gap-1"
                        onClick={() => onNewObjective(result)}
                      >
                        <Plus className="size-3.5" />
                        <span>Objetivo</span>
                      </Button>
                      <button
                        type="button"
                        aria-label={isCollapsed ? 'Desplegar' : 'Plegar'}
                        onClick={() => toggleResult(result.id)}
                        className="rounded-full p-1.5 text-ink-3 hover:bg-black/5 hover:text-ink transition-colors"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/60">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${ratioPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-ink-3 shrink-0">
                      {progress.tasksDone} / {progress.tasksTotal} pasos ({ratioPercent}%)
                    </span>
                  </div>
                </div>

                {/* OBJECTIVES ACCORDION */}
                {!isCollapsed && (
                  <div className="flex flex-col gap-2.5 p-3">
                    {objectives.length === 0 ? (
                      <div className="flex items-center justify-between rounded-xl border border-dashed border-line/80 bg-surface/50 px-3.5 py-2.5 text-[12px] text-ink-3">
                        <span>Sin objetivos definidos aún para este resultado.</span>
                        <Button
                          variant="ghost"
                          className="text-[12px] text-accent p-0 h-auto"
                          onClick={() => onNewObjective(result)}
                        >
                          + Añadir primer objetivo
                        </Button>
                      </div>
                    ) : (
                      objectives.map((obj) => {
                        const objCollapsed = collapsedObjectiveIds.has(obj.id)
                        const objTasks = tasksOfObjective(state, obj.id)
                        const objDone = obj.status === 'done'

                        return (
                          <div
                            key={obj.id}
                            className="rounded-xl border border-line/80 bg-subtle/40 p-2.5 transition-colors"
                          >
                            {/* OBJECTIVE TITLE ROW */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleObjective(obj.id)}
                                  className="text-ink-3 hover:text-ink"
                                >
                                  {objCollapsed ? (
                                    <ChevronRight className="size-3.5" />
                                  ) : (
                                    <ChevronDown className="size-3.5" />
                                  )}
                                </button>
                                <Link
                                  to={`/planning/objectives/${obj.id}`}
                                  className={`truncate text-[14px] font-semibold hover:text-accent transition-colors ${
                                    objDone ? 'line-through text-ink-3' : 'text-ink'
                                  }`}
                                >
                                  {obj.name}
                                </Link>
                                <span className="text-[11px] text-ink-3 shrink-0">
                                  ({objTasks.length} {objTasks.length === 1 ? 'paso' : 'pasos'})
                                </span>
                              </div>

                              <Button
                                variant="ghost"
                                className="text-[11px] text-accent h-auto px-2 py-0.5 shrink-0"
                                onClick={() => onNewTask(result.id, obj.id)}
                              >
                                + Paso
                              </Button>
                            </div>

                            {obj.doneWhen && (
                              <p className="mt-1 pl-5 text-[11px] text-ink-3">
                                <strong>Hecho cuando:</strong> {obj.doneWhen}
                              </p>
                            )}

                            {/* TASKS / PASOS OF THIS OBJECTIVE */}
                            {!objCollapsed && objTasks.length > 0 && (
                              <div className="mt-2 flex flex-col gap-1.5 pl-4 border-l-2 border-line/80">
                                {objTasks.map((task) => (
                                  <TaskRow
                                    key={task.id}
                                    task={task}
                                    onToggle={() => handleToggleTask(task)}
                                    showContext={false}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
