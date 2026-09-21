import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Edit2, Plus } from 'lucide-react'
import { TaskRow } from '@/components/task/TaskRow'
import { Button } from '@/components/ui/primitives'
import { SaberProgressBar } from '@/components/ui/SaberProgressBar'
import { completeTask, reopenTask } from '@/data/actions'
import {
  activeObjectivesOfResult,
  resultProgress,
  tasksOfObjective,
  tasksOfResult,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import type { Project, Result, Task } from '@/domain/types'

interface GlobalHierarchyTreeProps {
  projects: Project[]
  results: Result[]
  onNewResult: (projectName?: string) => void
  onNewObjective: (result: Result) => void
  onNewTask: (resultId: string, objectiveId?: string) => void
  onNewProject: () => void
  onEditProject?: (project: Project) => void
  onOpenTactical?: (taskId: string) => void
}

export function GlobalHierarchyTree({
  projects,
  results,
  onNewResult,
  onNewObjective,
  onNewTask,
  onNewProject,
  onEditProject,
  onOpenTactical,
}: GlobalHierarchyTreeProps) {
  const { t } = useTranslation()
  const state = useAleph()
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())
  const [collapsedResults, setCollapsedResults] = useState<Set<string>>(new Set())

  const toggleProject = (id: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleResult = (id: string) => {
    setCollapsedResults((prev) => {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-ink-3">
          {t('planning.fullTreeHint')}
        </p>
        <Button
          variant="secondary"
          onClick={onNewProject}
          className="text-[12px] px-2.5 py-1 flex items-center gap-1"
        >
          <Plus className="size-3.5" />
          <span>{t('planning.defineProject')}</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {projects.map((project) => {
          const isProjectCollapsed = collapsedProjects.has(project.id)
          const projectResults = results.filter(
            (r) =>
              (r.projectName?.trim() || '').toLowerCase() ===
              project.name.trim().toLowerCase(),
          )
          const accentColor = project.color || '#7a3fe0'

          return (
            <div
              key={project.id}
              className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs"
            >
              {/* PROJECT ROW */}
              <div className="flex items-center justify-between border-b border-line/50 bg-surface/40 p-3 pl-4">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleProject(project.id)}
                    className="text-ink-3 hover:text-ink"
                  >
                    {isProjectCollapsed ? (
                      <ChevronRight className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>
                  <span
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-bold text-ink">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="truncate text-[11px] text-ink-3">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-ink-3">
                    {projectResults.length} {t('common.result')}
                  </span>
                  {onEditProject && (
                    <button
                      type="button"
                      onClick={() => onEditProject(project)}
                      className="flex items-center gap-1 rounded-lg border border-line/60 bg-white px-2 py-0.5 text-[11px] font-medium text-ink-2 hover:border-accent hover:text-accent transition-colors"
                    >
                      <Edit2 className="size-3" />
                      <span>{t('common.edit')}</span>
                    </button>
                  )}
                  <Button
                    variant="ghost"
                    className="text-[12px] text-accent px-2 py-0.5"
                    onClick={() => onNewResult(project.name)}
                  >
                    + {t('common.result')}
                  </Button>
                </div>
              </div>

              {/* RESULTS INSIDE PROJECT */}
              {!isProjectCollapsed && (
                <div className="flex flex-col gap-2 p-3 pl-6">
                  {projectResults.length === 0 ? (
                    <p className="text-[12px] text-ink-3 italic py-1">
                      {t('planning.emptyProjectResults')}
                    </p>
                  ) : (
                    projectResults.map((result) => {
                      const isResultCollapsed = collapsedResults.has(result.id)
                      const objectives = activeObjectivesOfResult(state, result.id)
                      const progress = resultProgress(state, result.id)
                      const projectColor = project.color || '#7a3fe0'

                      return (
                        <div
                          key={result.id}
                          className="relative overflow-hidden rounded-xl border border-line/70 p-2.5 transition-all hover:border-line-strong"
                          style={{
                            background: `linear-gradient(to right, ${projectColor}0e, transparent 60%)`,
                            borderLeftWidth: '3.5px',
                            borderLeftColor: projectColor,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => toggleResult(result.id)}
                                className="text-ink-3 hover:text-ink"
                              >
                                {isResultCollapsed ? (
                                  <ChevronRight className="size-3.5" />
                                ) : (
                                  <ChevronDown className="size-3.5" />
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${projectColor}15`,
                                    color: projectColor,
                                  }}
                                >
                                  {t('common.result')}
                                </span>
                                <Link
                                  to={`/planning/results/${result.id}`}
                                  className="mt-0.5 block truncate text-[14px] font-semibold text-ink hover:underline"
                                >
                                  {result.name}
                                </Link>
                              </div>
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                                style={{
                                  backgroundColor: `${projectColor}15`,
                                  color: projectColor,
                                }}
                              >
                                {t('planning.results.tasksDone', {
                                  done: progress.tasksDone,
                                  total: progress.tasksTotal,
                                })}
                              </span>
                            </div>

                            <Button
                              variant="ghost"
                              className="text-[11px] px-2 py-0.5 shrink-0 hover:bg-black/5"
                              style={{ color: projectColor }}
                              onClick={() => onNewObjective(result)}
                            >
                              + {t('common.objective')}
                            </Button>
                          </div>

                          {/* Multi-saber progress bar for result in tree */}
                          <div className="mt-1.5">
                            <SaberProgressBar
                              tasks={tasksOfResult(state, result.id)}
                              projectColor={projectColor}
                              showBadges={true}
                              size="sm"
                            />
                          </div>

                          {/* OBJECTIVES */}
                          {!isResultCollapsed && (
                            <div
                              className="mt-2.5 flex flex-col gap-2.5 pl-4 border-l-2"
                              style={{ borderLeftColor: `${projectColor}35` }}
                            >
                              {objectives.length === 0 ? (
                                <p className="text-[11px] text-ink-3 italic">
                                  {t('planning.emptyResultObjectives')}
                                </p>
                              ) : (
                                objectives.map((obj) => {
                                  const tasks = tasksOfObjective(state, obj.id)
                                  return (
                                    <div
                                      key={obj.id}
                                      className="flex flex-col gap-1.5 rounded-lg p-2 transition-all border border-line/60"
                                      style={{
                                        borderLeftWidth: '3px',
                                        borderLeftColor: projectColor,
                                        background: `linear-gradient(to right, ${projectColor}06 0%, #ffffff 45%)`,
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <Link
                                          to={`/planning/objectives/${obj.id}`}
                                          className="min-w-0 text-[13px] font-medium text-ink hover:underline truncate flex items-center gap-1.5"
                                        >
                                          <span
                                            className="size-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: projectColor }}
                                          />
                                          <span className="min-w-0">
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-3">
                                              {t('common.objective')}
                                            </span>
                                            <span>{obj.name}</span>
                                          </span>
                                        </Link>
                                        <Button
                                          variant="ghost"
                                          className="text-[10px] px-1.5 py-0.5 font-semibold hover:bg-black/5"
                                          style={{ color: projectColor }}
                                          onClick={() => onNewTask(result.id, obj.id)}
                                        >
                                          + {t('common.task')}
                                        </Button>
                                      </div>

                                      {/* Objective saber progress */}
                                      {tasks.length > 0 && (
                                        <div className="px-1">
                                          <SaberProgressBar
                                            tasks={tasks}
                                            projectColor={projectColor}
                                            showBadges={true}
                                            size="sm"
                                          />
                                        </div>
                                      )}

                                      {tasks.length > 0 && (
                                        <div
                                          className="flex flex-col gap-1 pl-3 border-l"
                                          style={{ borderLeftColor: `${projectColor}30` }}
                                        >
                                          {tasks.map((task) => (
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
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
