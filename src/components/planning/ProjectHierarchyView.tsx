import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { SaberProgressBar } from '@/components/ui/SaberProgressBar'
import { completeTask, reopenTask } from '@/data/actions'
import {
  activeObjectivesOfResult,
  tasksOfObjective,
  tasksOfResult,
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
  onOpenTactical?: (taskId: string) => void
}

export function ProjectHierarchyView({
  project,
  results,
  onNewResult,
  onNewObjective,
  onNewTask,
  onEditProject,
  onOpenTactical,
}: ProjectHierarchyViewProps) {
  const { t } = useTranslation()
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
    <div
      className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-paper"
      style={{ borderLeftWidth: '5px', borderLeftColor: accentColor }}
    >
      {/* PROJECT */}
      <div
        className="p-4 pl-4"
        style={{
          background: `linear-gradient(to right, ${accentColor}14 0%, #ffffff 42%)`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: accentColor }}
            >
              {t('common.project')}
            </span>
            <h2 className="mt-1.5 text-[20px] font-bold text-ink leading-tight">
              {project.name}
            </h2>
            {project.description && (
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onEditProject(project)}
              className="flex items-center gap-1 rounded-lg border border-line/70 bg-surface/70 px-2.5 py-1.5 text-[12px] font-medium text-ink-2 hover:bg-white hover:border-accent/60 hover:text-accent transition-all"
            >
              <Edit2 className="size-3.5" />
              <span>{t('common.edit')}</span>
            </button>
            <Button
              onClick={() => onNewResult(project.name)}
              className="flex items-center gap-1.5 shadow-sm text-[13px] px-3 py-1.5"
            >
              <Plus className="size-4" />
              <span>{t('planning.newResult')}</span>
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <Layers className="size-4 text-ink-2" />
            <strong className="text-ink font-semibold">{results.length}</strong>{' '}
            {t('common.result')}
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="size-4 text-ink-2" />
            <strong className="text-ink font-semibold">{allObjectives.length}</strong>{' '}
            {t('common.objective')}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-600" />
            {t('planning.results.progress', {
              done: completedTasks.length,
              total: allTasks.length,
            })}{' '}
            ({overallRatio}%)
          </span>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="border-t border-line/60 px-4 py-6 text-center">
          <p className="text-[14px] font-medium text-ink-2">{t('planning.emptyProjectResults')}</p>
          <Button
            onClick={() => onNewResult(project.name)}
            className="mt-3 inline-flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>{t('planning.defineResult')}</span>
          </Button>
        </div>
      ) : (
        <div className="border-t border-line/60">
          {results.map((result, resultIndex) => {
            const isCollapsed = collapsedResultIds.has(result.id)
            const objectives = activeObjectivesOfResult(state, result.id)
            const projectColor = project.color || '#7a3fe0'
            const lastResult = resultIndex === results.length - 1

            return (
              <div
                key={result.id}
                className={lastResult ? '' : 'border-b border-line/50'}
              >
                <div
                  className="px-4 py-3"
                  style={{
                    background: `linear-gradient(to right, ${projectColor}0c 0%, transparent 55%)`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${projectColor}18`,
                            color: projectColor,
                          }}
                        >
                          {t('common.result')}
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
                        className="mt-1 block text-[16px] font-bold text-ink hover:underline"
                      >
                        {result.name}
                      </Link>
                      {result.why && (
                        <p className="mt-0.5 text-[12px] text-ink-3 line-clamp-1 italic">
                          "{result.why}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="secondary"
                        className="text-[12px] px-2.5 py-1 flex items-center gap-1"
                        onClick={() => onNewObjective(result)}
                      >
                        <Plus className="size-3.5" />
                        <span>{t('common.objective')}</span>
                      </Button>
                      <button
                        type="button"
                        aria-label={isCollapsed ? t('common.show') : t('common.hide')}
                        onClick={() => toggleResult(result.id)}
                        className="rounded-full p-1.5 text-ink-3 hover:bg-black/5 hover:text-ink"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <SaberProgressBar
                      tasks={tasksOfResult(state, result.id)}
                      projectColor={projectColor}
                      showBadges={true}
                      size="md"
                    />
                  </div>

                  {!isCollapsed && (
                    <div
                      className="mt-3 ml-1 flex flex-col gap-2.5 border-l-2 pl-3"
                      style={{ borderLeftColor: `${projectColor}40` }}
                    >
                      {objectives.length === 0 ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-line/80 bg-surface/50 px-3 py-2 text-[12px] text-ink-3">
                          <span>{t('planning.emptyResultObjectives')}</span>
                          <button
                            type="button"
                            className="font-semibold hover:underline"
                            style={{ color: projectColor }}
                            onClick={() => onNewObjective(result)}
                          >
                            + {t('planning.defineObjective')}
                          </button>
                        </div>
                      ) : (
                        objectives.map((obj) => {
                          const objCollapsed = collapsedObjectiveIds.has(obj.id)
                          const objTasks = tasksOfObjective(state, obj.id)
                          const objDone = obj.status === 'done'

                          return (
                            <div
                              key={obj.id}
                              className="rounded-xl bg-white/80 p-2.5"
                              style={{
                                borderLeftWidth: '3px',
                                borderLeftStyle: 'solid',
                                borderLeftColor: projectColor,
                                background: `linear-gradient(to right, ${projectColor}0a 0%, #ffffff 50%)`,
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleObjective(obj.id)}
                                    className="text-ink-3 hover:text-ink shrink-0"
                                  >
                                    {objCollapsed ? (
                                      <ChevronRight className="size-3.5" />
                                    ) : (
                                      <ChevronDown className="size-3.5" />
                                    )}
                                  </button>
                                  <span
                                    className="size-2 rounded-full shrink-0"
                                    style={{ backgroundColor: projectColor }}
                                    aria-hidden="true"
                                  />
                                  <div className="min-w-0">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-3">
                                      {t('common.objective')}
                                    </span>
                                    <Link
                                      to={`/planning/objectives/${obj.id}`}
                                      className={`truncate text-[14px] font-semibold hover:underline ${
                                        objDone ? 'line-through text-ink-3' : 'text-ink'
                                      }`}
                                    >
                                      {obj.name}
                                    </Link>
                                  </div>
                                  <span className="text-[11px] text-ink-3 shrink-0">
                                    ({objTasks.length} {t('common.task')})
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  className="text-[11px] h-auto px-2 py-0.5 shrink-0 font-semibold hover:bg-black/5"
                                  style={{ color: projectColor }}
                                  onClick={() => onNewTask(result.id, obj.id)}
                                >
                                  + {t('common.task')}
                                </Button>
                              </div>

                              {obj.doneWhen && (
                                <p className="mt-1 pl-6 text-[11px] text-ink-3">
                                  <strong>{t('planning.objectives.doneWhen')}:</strong> {obj.doneWhen}
                                </p>
                              )}

                              {objTasks.length > 0 && (
                                <div className="mt-2 pl-6 pr-1">
                                  <SaberProgressBar
                                    tasks={objTasks}
                                    projectColor={projectColor}
                                    showBadges={true}
                                    size="sm"
                                  />
                                </div>
                              )}

                              {!objCollapsed && objTasks.length > 0 && (
                                <div
                                  className="mt-2 flex flex-col gap-1.5 border-l-2 pl-3 ml-2"
                                  style={{ borderLeftColor: `${projectColor}30` }}
                                >
                                  {objTasks.map((task) => (
                                    <TaskRow
                                      key={task.id}
                                      task={task}
                                      onToggle={() => handleToggleTask(task)}
                                      onOpenTactical={() => onOpenTactical?.(task.id)}
                                      onOpen={() => onOpenTactical?.(task.id)}
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
