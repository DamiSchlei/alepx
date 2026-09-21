import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Folder, Plus, Edit2 } from 'lucide-react'
import type { Project, Result, Task } from '@/domain/types'

interface ProjectCarouselProps {
  projects: Project[]
  selectedProjectId: string
  onSelectProject: (id: string) => void
  onNewProject: () => void
  onEditProject: (project: Project) => void
  results: Result[]
  tasks: Task[]
}

export function ProjectCarousel({
  projects,
  selectedProjectId,
  onSelectProject,
  onNewProject,
  onEditProject,
  results,
  tasks,
}: ProjectCarouselProps) {
  const { t } = useTranslation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const el = container.querySelector(`[data-project-id="${selectedProjectId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedProjectId])

  return (
    <div className="relative w-full py-1">
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3 overflow-x-auto px-1 py-1 no-scrollbar snap-x snap-mandatory"
      >
        {projects.map((project) => {
          const isSelected = project.id === selectedProjectId
          const projectResults = results.filter(
            (r) => (r.projectName?.trim() || '').toLowerCase() === project.name.trim().toLowerCase(),
          )
          const resultIds = new Set(projectResults.map((r) => r.id))
          const projectTasks = tasks.filter((t) => t.resultId && resultIds.has(t.resultId))
          const doneTasks = projectTasks.filter(
            (t) => t.status === 'done_on_time' || t.status === 'done_late',
          )
          const progressPercent =
            projectTasks.length > 0
              ? Math.round((doneTasks.length / projectTasks.length) * 100)
              : 0

          const accentColor = project.color || '#7a3fe0'

          return (
            <div
              key={project.id}
              data-project-id={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`group relative flex min-w-[220px] max-w-[260px] cursor-pointer flex-col justify-between rounded-2xl border p-3.5 transition-all snap-center select-none ${
                isSelected
                  ? 'border-accent bg-white shadow-paper ring-2 ring-accent/20'
                  : 'border-line bg-surface/80 hover:bg-white hover:border-accent/40'
              }`}
            >
              {/* Header: Icon + Name + Edit */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="flex size-7 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Folder className="size-4" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="flex size-2 rounded-full bg-accent animate-pulse" />
                    )}
                    <button
                      type="button"
                      aria-label={`${t('common.edit')} ${project.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        onEditProject(project)
                      }}
                      className="flex items-center gap-1 rounded-lg border border-line/70 bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink-2 shadow-2xs hover:border-accent hover:bg-white hover:text-accent transition-all cursor-pointer"
                    >
                      <Edit2 className="size-3" />
                      <span>{t('common.edit')}</span>
                    </button>
                  </div>
                </div>

                <h3 className="mt-2.5 line-clamp-1 text-[15px] font-bold text-ink">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-3">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Footer: Metrics & Progress bar */}
              <div className="mt-3 pt-2.5 border-t border-line/60">
                <div className="flex items-center justify-between text-[11px] font-medium text-ink-3">
                  <span>
                    {projectResults.length}{' '}
                    {projectResults.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line/60">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: accentColor,
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {/* Card to create new project */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onNewProject()
          }}
          className="flex min-w-[150px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface/40 p-4 text-ink-3 transition-all hover:border-accent hover:bg-white hover:text-accent snap-center cursor-pointer shadow-2xs"
        >
          <span className="flex size-9 items-center justify-center rounded-full border border-line bg-white shadow-xs">
            <Plus className="size-4" />
          </span>
          <span className="text-[12px] font-semibold text-center leading-tight">
            {t('planning.newProject')}
          </span>
        </button>
      </div>
    </div>
  )
}
