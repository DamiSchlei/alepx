import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Edit2, Plus } from 'lucide-react'
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
import type { Project, Result, Task } from '@/domain/types'

interface GlobalHierarchyTreeProps {
  projects: Project[]
  results: Result[]
  onNewResult: (projectName?: string) => void
  onNewObjective: (result: Result) => void
  onNewTask: (resultId: string, objectiveId?: string) => void
  onNewProject: () => void
  onEditProject?: (project: Project) => void
}

export function GlobalHierarchyTree({
  projects,
  results,
  onNewResult,
  onNewObjective,
  onNewTask,
  onNewProject,
  onEditProject,
}: GlobalHierarchyTreeProps) {
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
          Mapa completo: Proyectos ➔ Resultados ➔ Objetivos ➔ Tareas
        </p>
        <Button
          variant="secondary"
          onClick={onNewProject}
          className="text-[12px] px-2.5 py-1 flex items-center gap-1"
        >
          <Plus className="size-3.5" />
          <span>Definir Proyecto</span>
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
                    {projectResults.length}{' '}
                    {projectResults.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                  {onEditProject && (
                    <button
                      type="button"
                      onClick={() => onEditProject(project)}
                      className="flex items-center gap-1 rounded-lg border border-line/60 bg-white px-2 py-0.5 text-[11px] font-medium text-ink-2 hover:border-accent hover:text-accent transition-colors"
                    >
                      <Edit2 className="size-3" />
                      <span>Editar</span>
                    </button>
                  )}
                  <Button
                    variant="ghost"
                    className="text-[12px] text-accent px-2 py-0.5"
                    onClick={() => onNewResult(project.name)}
                  >
                    + Resultado
                  </Button>
                </div>
              </div>

              {/* RESULTS INSIDE PROJECT */}
              {!isProjectCollapsed && (
                <div className="flex flex-col gap-2 p-3 pl-6">
                  {projectResults.length === 0 ? (
                    <p className="text-[12px] text-ink-3 italic py-1">
                      Sin resultados en este proyecto.
                    </p>
                  ) : (
                    projectResults.map((result) => {
                      const isResultCollapsed = collapsedResults.has(result.id)
                      const objectives = activeObjectivesOfResult(state, result.id)
                      const progress = resultProgress(state, result.id)

                      return (
                        <div
                          key={result.id}
                          className="rounded-xl border border-line/70 bg-subtle/30 p-2.5"
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
                              <Link
                                to={`/planning/results/${result.id}`}
                                className="truncate text-[14px] font-semibold text-ink hover:text-accent"
                              >
                                {result.name}
                              </Link>
                              <span className="text-[11px] text-ink-3 shrink-0">
                                ({progress.tasksDone}/{progress.tasksTotal} hechos)
                              </span>
                            </div>

                            <Button
                              variant="ghost"
                              className="text-[11px] text-accent px-2 py-0.5 shrink-0"
                              onClick={() => onNewObjective(result)}
                            >
                              + Objetivo
                            </Button>
                          </div>

                          {/* OBJECTIVES */}
                          {!isResultCollapsed && (
                            <div className="mt-2 flex flex-col gap-2 pl-4 border-l-2 border-line">
                              {objectives.length === 0 ? (
                                <p className="text-[11px] text-ink-3 italic">
                                  Sin objetivos aún.
                                </p>
                              ) : (
                                objectives.map((obj) => {
                                  const tasks = tasksOfObjective(state, obj.id)
                                  return (
                                    <div key={obj.id} className="flex flex-col gap-1">
                                      <div className="flex items-center justify-between">
                                        <Link
                                          to={`/planning/objectives/${obj.id}`}
                                          className="text-[13px] font-medium text-ink hover:text-accent truncate"
                                        >
                                          • {obj.name}
                                        </Link>
                                        <Button
                                          variant="ghost"
                                          className="text-[10px] text-accent px-1.5 py-0.5"
                                          onClick={() => onNewTask(result.id, obj.id)}
                                        >
                                          + Paso
                                        </Button>
                                      </div>
                                      {tasks.length > 0 && (
                                        <div className="flex flex-col gap-1 pl-3">
                                          {tasks.map((task) => (
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
