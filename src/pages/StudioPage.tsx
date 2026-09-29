import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DayCanvas } from '@/components/home/DayCanvas'
import { DayCarousel } from '@/components/home/DayCarousel'
import { HomeStickyChrome } from '@/components/home/HomeStickyChrome'
import { ObjectiveFormSheet } from '@/components/planning/ObjectiveForm'
import { PlanningFlowGuide } from '@/components/planning/PlanningFlowGuide'
import { ProjectFormSheet } from '@/components/planning/ProjectFormSheet'
import { ResultFormSheet } from '@/components/planning/ResultForm'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { VisualPlanningField } from '@/components/planning/VisualPlanningField'
import { allProjects, resultsOfProject } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { shiftIsoWeek, toDayKey } from '@/domain/dates'
import type { Project, Result } from '@/domain/types'
import { PlanningPage } from '@/pages/PlanningPage'

export function StudioPage({ focus }: { focus: 'day' | 'plan' }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()
  const todayKey = toDayKey(new Date())
  const localeTag = i18n.language?.startsWith('en') ? 'en-US' : 'es-AR'
  const locale = state.character.locale

  const [activeDay, setActiveDay] = useState(todayKey)
  const [canvasOpenDay, setCanvasOpenDay] = useState<string | null>(null)
  const [ledger, setLedger] = useState(false)
  const projects = allProjects(state)
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '')

  const project = useMemo(() => {
    return projects.find((item) => item.id === selectedProjectId) ?? projects[0]
  }, [projects, selectedProjectId])

  const projectResults = useMemo(() => {
    if (!project) return []
    return resultsOfProject(state, project.name)
  }, [project, state])

  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [resultFormOpen, setResultFormOpen] = useState(false)
  const [objectiveResult, setObjectiveResult] = useState<Result | undefined>()
  const [taskPreset, setTaskPreset] = useState<{ resultId?: string; objectiveId?: string } | null>(null)

  const jumpTo = useCallback((dayKey: string) => {
    setActiveDay(dayKey)
  }, [])

  useEffect(() => {
    if (focus !== 'plan') return
    document.getElementById('studio-plan')?.scrollIntoView({ block: 'start' })
  }, [focus])

  if (ledger) {
    return (
      <div className="pb-8">
        <button
          type="button"
          onClick={() => setLedger(false)}
          className="mb-3 min-h-11 rounded-full px-3 text-[14px] font-semibold text-violet"
        >
          {t('flow.backToFlow')}
        </button>
        <PlanningPage />
      </div>
    )
  }

  return (
    <div className="pb-8 xl:grid xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] xl:items-start xl:gap-8">
      <section
        id="studio-day"
        className={
          focus === 'plan'
            ? 'max-xl:order-2 xl:sticky xl:top-3 xl:max-h-[calc(100dvh-var(--tab-bar-height)-1.5rem)] xl:overflow-y-auto'
            : 'xl:sticky xl:top-3 xl:max-h-[calc(100dvh-var(--tab-bar-height)-1.5rem)] xl:overflow-y-auto'
        }
      >
        <HomeStickyChrome
          activeDay={activeDay}
          todayKey={todayKey}
          locale={locale}
          localeTag={localeTag}
          showHoy={activeDay !== todayKey}
          onHoy={() => jumpTo(todayKey)}
          onPrev={() => jumpTo(shiftIsoWeek(activeDay, -1))}
          onNext={() => jumpTo(shiftIsoWeek(activeDay, 1))}
          onSelectDay={jumpTo}
        />
        <DayCarousel
          activeDay={activeDay}
          todayKey={todayKey}
          localeTag={localeTag}
          onOpenCanvas={(dayKey) => setCanvasOpenDay(dayKey)}
        />
      </section>

      <section id="studio-plan" className={focus === 'plan' ? 'max-xl:order-1 mt-6 xl:mt-3' : 'mt-6 xl:mt-3'}>
        <PlanningFlowGuide
          dayKey={activeDay}
          onNameResult={() => setResultFormOpen(true)}
          onNameObjective={(resultId) => {
            const match = state.results.find((item) => item.id === resultId)
            if (match) setObjectiveResult(match)
          }}
          onAddTodayStep={(resultId, objectiveId) => setTaskPreset({ resultId, objectiveId })}
        />

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setLedger(true)}
            className="min-h-11 rounded-full px-3 text-[13px] font-semibold text-ink-3"
          >
            {t('flow.ledger')}
          </button>
        </div>

        {project ? (
          <div className="mt-2">
            <VisualPlanningField
              project={project}
              results={projectResults}
              currentDay={activeDay}
              onNewResult={() => setResultFormOpen(true)}
              onNewObjective={(result) => setObjectiveResult(result)}
              onNewTask={(resultId, objectiveId) => setTaskPreset({ resultId, objectiveId })}
              onEditProject={(next) => {
                setEditingProject(next)
                setProjectFormOpen(true)
              }}
              onDeleteProject={(next) => {
                setEditingProject(next)
                setProjectFormOpen(true)
              }}
              onZoomResult={(result) => navigate(`/planning/results/${result.id}`)}
            />
            {projects.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {projects.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedProjectId(item.id)}
                    className={
                      item.id === project.id
                        ? 'min-h-11 shrink-0 rounded-full bg-violet-soft px-3 text-[13px] font-semibold text-violet'
                        : 'min-h-11 shrink-0 rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-ink-2'
                    }
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {canvasOpenDay ? (
        <DayCanvas
          dayKey={canvasOpenDay}
          todayKey={todayKey}
          localeTag={localeTag}
          onClose={() => setCanvasOpenDay(null)}
        />
      ) : null}

      <ProjectFormSheet
        open={projectFormOpen}
        project={editingProject}
        onClose={() => {
          setProjectFormOpen(false)
          setEditingProject(undefined)
        }}
        onDeleted={() => {
          setProjectFormOpen(false)
          setEditingProject(undefined)
        }}
      />
      <ResultFormSheet
        open={resultFormOpen}
        onClose={() => setResultFormOpen(false)}
        initialProjectName={project?.name}
      />
      {objectiveResult ? (
        <ObjectiveFormSheet
          open
          resultId={objectiveResult.id}
          onClose={() => setObjectiveResult(undefined)}
        />
      ) : null}
      {taskPreset ? (
        <TaskFormSheet
          open
          preset={{ ...taskPreset, dueAt: activeDay }}
          onClose={() => setTaskPreset(null)}
        />
      ) : null}
    </div>
  )
}
