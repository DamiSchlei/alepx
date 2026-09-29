import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft,
  Plus,
  Check,
  Sparkles,
  LayoutList,
  Compass,
  X,
  Maximize2,
  FolderGit2,
  SlidersHorizontal,
} from 'lucide-react'
import { DayTaskViewer } from '@/components/home/DayTaskViewer'
import { DayTacticalDashboard } from '@/components/home/DayTacticalDashboard'
import { PlanningFlowGuide } from '@/components/planning/PlanningFlowGuide'
import { ProjectFormSheet } from '@/components/planning/ProjectFormSheet'
import { VisualPlanningField } from '@/components/planning/VisualPlanningField'
import { TacticalTaskModal } from '@/components/task/TacticalTaskModal'
import { ResultFormSheet } from '@/components/planning/ResultForm'
import {
  completeTask,
  createObjective,
  createTask,
  reopenTask,
} from '@/data/actions'
import { freeHoursForDay, plannedHoursForDay } from '@/data/dayLoad'
import {
  activeResults,
  allProjects,
  objectiveById,
  objectivesOfResult,
  projectColorOfResult,
  tasksForDay,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { parseLocal } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { TERRENO_MAP, TERRENOS } from '@/domain/terrenos'
import { formatHours } from '@/i18n/format'
import type { Objective, Project, Result, Task, Terreno } from '@/domain/types'

interface DayCanvasProps {
  dayKey: string
  todayKey: string
  localeTag: string
  onClose: () => void
}

export function DayCanvas({
  dayKey,
  todayKey,
  localeTag,
  onClose,
}: DayCanvasProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()
  const locale = state.character.locale
  const cap = state.character.dailyHourCap ?? 5
  const tasks = tasksForDay(state, dayKey)
  const results = activeResults(state)
  const projects = allProjects(state)

  // Map of Projects -> Results inside
  const projectMap = useMemo(() => {
    const map = new Map<string, Result[]>()
    for (const p of projects) {
      if (!map.has(p.name)) map.set(p.name, [])
    }
    for (const r of results) {
      const pName = r.projectName?.trim() || 'La Obra Principal'
      const list = map.get(pName) ?? []
      list.push(r)
      map.set(pName, list)
    }
    return map
  }, [projects, results])

  const projectNames = useMemo(() => {
    const names = Array.from(projectMap.keys())
    return names.length > 0 ? names : ['La Obra Principal']
  }, [projectMap])

  const [selectedProject, setSelectedProject] = useState<string>(
    results[0]?.projectName?.trim() || projectNames[0] || 'La Obra Principal',
  )

  const currentProjectName = projectNames.includes(selectedProject)
    ? selectedProject
    : (projectNames[0] ?? 'La Obra Principal')

  const resultsInCurrentProject = useMemo(() => {
    return projectMap.get(currentProjectName) ?? results
  }, [projectMap, currentProjectName, results])

  const planned = plannedHoursForDay(state, dayKey)
  const free = freeHoursForDay(cap, planned)

  const [viewMode, setViewMode] = useState<'canvas' | 'list' | 'tactical'>('canvas')
  const [selectedTacticalTaskId, setSelectedTacticalTaskId] = useState<string | null>(null)
  const [zoomedResult, setZoomedResult] = useState<Result | null>(null)
  const [zoomedObjective, setZoomedObjective] = useState<Objective | null>(null)
  const [zoomedObjectiveResultName, setZoomedObjectiveResultName] = useState<string>('')
  const [showPhilosophyModal, setShowPhilosophyModal] = useState(false)
  const [showResultForm, setShowResultForm] = useState(false)
  const [projectForm, setProjectForm] = useState<Project | undefined>()
  const [projectFormOpen, setProjectFormOpen] = useState(false)

  const activeProject = useMemo(() => {
    return (
      projects.find(
        (proj) => proj.name.trim().toLowerCase() === currentProjectName.trim().toLowerCase(),
      ) ?? projects[0]
    )
  }, [projects, currentProjectName])

  // Seed modal state
  const [showSeedModal, setShowSeedModal] = useState(false)
  const [seedResultId, setSeedResultId] = useState<string | undefined>(undefined)
  const [seedObjectiveId, setSeedObjectiveId] = useState<string | undefined>(undefined)
  const [seedTerreno, setSeedTerreno] = useState<Terreno>('literatura')
  const [seedTitle, setSeedTitle] = useState('')
  const [seedHours, setSeedHours] = useState(1)

  // New objective modal state
  const [showNewObjectiveModal, setShowNewObjectiveModal] = useState(false)
  const [targetResultForObjective, setTargetResultForObjective] = useState<Result | null>(null)
  const [newObjectiveName, setNewObjectiveName] = useState('')
  const [newObjectiveDoneWhen, setNewObjectiveDoneWhen] = useState('')

  // Format header date
  const dateObj = parseLocal(dayKey)
  const dateLabel = new Intl.DateTimeFormat(localeTag, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dateObj)
  const isToday = dayKey === todayKey

  const handleToggleTask = (task: Task) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
    } else {
      completeTask(task.id)
    }
  }

  const handleOpenSeed = (resId?: string, objId?: string) => {
    setSeedResultId(resId || resultsInCurrentProject[0]?.id || results[0]?.id)
    setSeedObjectiveId(objId)
    setSeedTitle('')
    setSeedHours(1)
    setSeedTerreno('literatura')
    setShowSeedModal(true)
  }

  const handleSeedSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = seedTitle.trim()
    if (!trimmed) return

    createTask({
      title: trimmed,
      terreno: seedTerreno,
      stage: 'execution',
      estimatedHours: seedHours,
      scheduledFor: dayKey,
      dueAt: dayKey,
      resultId: seedResultId || resultsInCurrentProject[0]?.id || results[0]?.id,
      objectiveId: seedObjectiveId || undefined,
    })

    setSeedTitle('')
    setSeedHours(1)
    setShowSeedModal(false)
  }

  const handleOpenNewObjective = (result: Result) => {
    setTargetResultForObjective(result)
    setNewObjectiveName('')
    setNewObjectiveDoneWhen('')
    setShowNewObjectiveModal(true)
  }

  const handleCreateObjective = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newObjectiveName.trim()
    if (!trimmed || !targetResultForObjective) return

    createObjective({
      resultId: targetResultForObjective.id,
      name: trimmed,
      doneWhen: newObjectiveDoneWhen.trim() || undefined,
    })

    setNewObjectiveName('')
    setNewObjectiveDoneWhen('')
    setShowNewObjectiveModal(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fbfbfa] text-ink overflow-hidden select-none">
      {/* Top Floating Navigation Bar */}
      <header className="shrink-0 flex flex-col gap-2 px-3 py-2.5 bg-white/90 backdrop-blur-md border-b border-line z-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('planning.canvas.backToCarousel')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-subtle text-ink-2 hover:text-ink hover:border-line-strong active:scale-95 transition-all text-[13px] font-medium shrink-0"
          >
            <ArrowLeft className="size-4" />
            <span>{t('common.back')}</span>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-bold capitalize leading-tight truncate">
              {dateLabel}
              {isToday ? (
                <span className="ml-1.5 rounded-full bg-[#f5f0ff] px-2 py-0.5 text-[10px] font-semibold text-[#7a3fe0]">
                  {t('common.today')}
                </span>
              ) : null}
            </h1>
            <p className="text-[11px] font-medium text-ink-3 truncate">
              {t('planning.canvas.hoursLine', {
                planned: formatHours(planned, locale),
                free: formatHours(free, locale),
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPhilosophyModal(true)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink-2 hover:text-[#7a3fe0] hover:border-[#7a3fe0]/40 transition-all"
            title={t('planning.canvas.philosophyTitle')}
            aria-label={t('planning.canvas.philosophyAria')}
          >
            <Sparkles className="size-3.5 text-[#7a3fe0]" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenSeed()}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#7a3fe0] text-white hover:bg-[#6832c7] active:scale-95 transition-all shadow-sm"
            title={t('home.clock.addTask')}
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div className="flex justify-center">
          <div className="flex rounded-full bg-subtle p-0.5 border border-line">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${
                viewMode === 'canvas'
                  ? 'bg-white shadow-xs text-ink font-semibold'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Compass className="size-3.5" />
              <span>{t('planning.canvas.canvas')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white shadow-xs text-ink font-semibold'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <LayoutList className="size-3.5" />
              <span>{t('planning.canvas.list')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tactical')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${
                viewMode === 'tactical'
                  ? 'bg-white shadow-xs text-purple-700 font-bold'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>{t('planning.canvas.tactical')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="mx-auto w-full max-w-3xl px-4 pt-4">
          <PlanningFlowGuide
            dayKey={dayKey}
            onNameResult={() => setShowResultForm(true)}
            onNameObjective={(resultId) => {
              const match = results.find((item) => item.id === resultId)
              if (match) handleOpenNewObjective(match)
            }}
            onAddTodayStep={(resultId, objectiveId) => handleOpenSeed(resultId, objectiveId)}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/planning')
              }}
              className="min-h-11 rounded-full px-3 text-[13px] font-semibold text-ink-3"
            >
              {t('flow.ledger')}
            </button>
          </div>
        </div>
        {viewMode === 'tactical' ? (
          <DayTacticalDashboard
            tasks={tasks}
            dayKey={dayKey}
            onOpenTacticalModal={(taskId) => setSelectedTacticalTaskId(taskId)}
            onQuickAddTask={() => handleOpenSeed()}
          />
        ) : viewMode === 'list' ? (
          <div className="max-w-md mx-auto p-4">
            <DayTaskViewer
              activeDay={dayKey}
              todayKey={todayKey}
              localeTag={localeTag}
            />
          </div>
        ) : (
          /* One tree: the day's step lives in the field, list and tactical stay beside it */
          <div className="min-h-full flex flex-col items-center justify-start px-2 max-w-3xl mx-auto pb-28">
            {projectNames.length > 1 ? (
              <div className="mb-3 flex w-full gap-2 overflow-x-auto px-2">
                {projectNames.map((pName) => (
                  <button
                    key={pName}
                    type="button"
                    onClick={() => setSelectedProject(pName)}
                    className={
                      pName === currentProjectName
                        ? 'min-h-11 shrink-0 rounded-full bg-violet-soft px-3 text-[13px] font-semibold text-violet'
                        : 'min-h-11 shrink-0 rounded-full border border-line bg-white px-3 text-[13px] font-medium text-ink-2'
                    }
                  >
                    {pName}
                  </button>
                ))}
              </div>
            ) : null}
            {activeProject ? (
              <div className="mb-4 w-full">
                <VisualPlanningField
                  project={activeProject}
                  results={resultsInCurrentProject}
                  currentDay={dayKey}
                  onNewResult={() => setShowResultForm(true)}
                  onNewObjective={handleOpenNewObjective}
                  onNewTask={(resultId, objectiveId) => handleOpenSeed(resultId, objectiveId)}
                  onEditProject={(project) => {
                    setProjectForm(project)
                    setProjectFormOpen(true)
                  }}
                  onDeleteProject={(project) => {
                    setProjectForm(project)
                    setProjectFormOpen(true)
                  }}
                  onOpenTacticalTask={(taskId) => setSelectedTacticalTaskId(taskId)}
                  onZoomResult={(result) => setZoomedResult(result)}
                  onZoomObjective={(objective, result) => {
                    setZoomedObjective(objective)
                    setZoomedObjectiveResultName(result.name)
                  }}
                />
              </div>
            ) : null}
            {tasks.filter(
                  (task) =>
                    !task.resultId ||
                    !resultsInCurrentProject.some((r) => r.id === task.resultId),
                ).length > 0 && (
                  <div className="relative flex flex-col rounded-[16px] border border-line bg-white p-3">
                    <div className="flex items-center justify-between pb-2 border-b border-line/60">
                      <div>
                        <h3 className="text-[14px] font-bold text-ink">
                          {t('planning.canvas.looseToday')}
                        </h3>
                        <p className="text-[11px] text-ink-3">
                          {t('planning.canvas.looseHint')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenSeed()}
                        className="flex items-center gap-1 text-[12px] font-semibold text-[#7a3fe0] px-2.5 py-1 rounded-full bg-[#f5f0ff]"
                      >
                        <Plus className="size-3" />
                        <span>{t('common.task')}</span>
                      </button>
                    </div>

                    <div className="mt-2.5 flex flex-col gap-1.5">
                      {tasks
                        .filter(
                          (task) =>
                            !task.resultId ||
                            !resultsInCurrentProject.some((r) => r.id === task.resultId),
                        )
                        .map((task) => (
                          <TaskStepRow
                            key={task.id}
                            task={task}
                            onToggle={() => handleToggleTask(task)}
                            onOpenTactical={() => setSelectedTacticalTaskId(task.id)}
                          />
                        ))}
                    </div>
                  </div>
                )}
          </div>
        )}
      </div>

      {/* MODAL: ZOOM SEMÁNTICO EN EL RESULTADO */}
      <AnimatePresence>
        {zoomedResult && (
          <ResultZoomModal
            result={zoomedResult}
            objectives={objectivesOfResult(state, zoomedResult.id)}
            tasks={tasks.filter((t) => t.resultId === zoomedResult.id)}
            onClose={() => setZoomedResult(null)}
            onToggleTask={handleToggleTask}
            onAddStep={() => {
              const resId = zoomedResult.id
              setZoomedResult(null)
              handleOpenSeed(resId)
            }}
            onAddObjective={() => {
              const res = zoomedResult
              setZoomedResult(null)
              handleOpenNewObjective(res)
            }}
            onZoomObjective={(obj) => {
              const rName = zoomedResult.name
              setZoomedResult(null)
              setZoomedObjective(obj)
              setZoomedObjectiveResultName(rName)
            }}
          />
        )}
      </AnimatePresence>

      {/* MODAL: ZOOM SEMÁNTICO EN EL OBJETIVO DECIDIDO */}
      <AnimatePresence>
        {zoomedObjective && (
          <ObjectiveZoomModal
            objective={zoomedObjective}
            resultName={zoomedObjectiveResultName || t('common.result')}
            tasks={tasks.filter((t) => t.objectiveId === zoomedObjective.id)}
            onClose={() => setZoomedObjective(null)}
            onToggleTask={handleToggleTask}
            onAddStep={() => {
              const objId = zoomedObjective.id
              const rId = zoomedObjective.resultId
              setZoomedObjective(null)
              handleOpenSeed(rId, objId)
            }}
          />
        )}
      </AnimatePresence>

      {/* MODAL: PRESENTACIÓN CONCEPTUAL (El Recorrido de la Obra) */}
      <AnimatePresence>
        {showPhilosophyModal && (
          <PhilosophyPresentationModal
            onClose={() => setShowPhilosophyModal(false)}
          />
        )}
      </AnimatePresence>

      {/* MODAL: AÑADIR TAREA */}
      <AnimatePresence>
        {showSeedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          >
            <motion.div
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              className="w-full max-w-md rounded-[20px] border border-line bg-white p-5 shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <h3 className="text-[17px] font-bold text-ink">{t('planning.canvas.addTaskTitle')}</h3>
                  <p className="text-[12px] text-ink-3">
                    {dateLabel} · {currentProjectName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSeedModal(false)}
                  className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-subtle"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSeedSubmit} className="mt-4 flex flex-col gap-4">
                {/* Selección del Resultado */}
                <div>
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    {t('common.result')}
                  </label>
                  <select
                    value={seedResultId || ''}
                    onChange={(e) => {
                      setSeedResultId(e.target.value)
                      setSeedObjectiveId(undefined)
                    }}
                    className="w-full rounded-[12px] border border-line px-3.5 py-2.5 text-[14px] font-medium bg-white text-ink outline-none focus:border-[#7a3fe0] focus:ring-1 focus:ring-[#7a3fe0]"
                  >
                    {resultsInCurrentProject.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destino: Objetivo o directo al Resultado */}
                <div>
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    {t('planning.canvas.objectiveName')}
                  </label>
                  <select
                    value={seedObjectiveId || ''}
                    onChange={(e) => setSeedObjectiveId(e.target.value || undefined)}
                    className="w-full rounded-[12px] border border-line px-3.5 py-2.5 text-[14px] font-medium bg-white text-ink outline-none focus:border-[#7a3fe0] focus:ring-1 focus:ring-[#7a3fe0]"
                  >
                    <option value="">{t('planning.canvas.seedObjectiveDirect')}</option>
                    {(seedResultId
                      ? objectivesOfResult(state, seedResultId)
                      : []
                    ).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Título de la acción */}
                <div>
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    {t('planning.tasks.nameLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={seedTitle}
                    onChange={(e) => setSeedTitle(e.target.value)}
                    placeholder={t('planning.tasks.titlePlaceholder')}
                    className="w-full rounded-[12px] border border-line px-3.5 py-2.5 text-[15px] outline-none focus:border-[#7a3fe0] focus:ring-1 focus:ring-[#7a3fe0]"
                  />
                </div>

                {/* Horas estimadas */}
                <div>
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    {t('planning.canvas.estimatedTime')}
                  </label>
                  <div className="flex gap-2">
                    {[0.5, 1, 1.5, 2, 3].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setSeedHours(h)}
                        className={`flex-1 py-1.5 rounded-[10px] text-[13px] border font-medium transition-all ${
                          seedHours === h
                            ? 'border-[#7a3fe0] bg-[#f5f0ff] font-bold text-[#7a3fe0]'
                            : 'border-line text-ink-2 hover:border-line-strong'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>

                {/* Naturaleza / Enfoque de la tarea */}
                <div>
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    {t('planning.canvas.actionFocus')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TERRENOS.map((terrId) => {
                      const tInfo = TERRENO_MAP[terrId]
                      const active = seedTerreno === terrId
                      const verb = t(`planning.canvas.terreno.${terrId}Verb`)
                      const sub = t(`planning.canvas.terreno.${terrId}Sub`)

                      return (
                        <button
                          key={terrId}
                          type="button"
                          onClick={() => setSeedTerreno(terrId)}
                          className={`flex flex-col items-center justify-center p-2 rounded-[12px] border text-center transition-all ${
                            active
                              ? 'border-current font-bold shadow-xs'
                              : 'border-line text-ink-3 hover:border-line-strong'
                          }`}
                          style={{
                            borderColor: active ? tInfo.color : undefined,
                            color: active ? tInfo.color : undefined,
                            backgroundColor: active ? `${tInfo.color}10` : 'white',
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: tInfo.color }}
                            />
                            <span className="text-[13px] font-semibold">{verb}</span>
                          </div>
                          <span className="text-[10px] opacity-75 mt-0.5">
                            {sub}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Botón Guardar */}
                <button
                  type="submit"
                  disabled={!seedTitle.trim()}
                  className="mt-2 w-full rounded-full bg-[#7a3fe0] py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#6832c7] active:scale-98 disabled:opacity-40 transition-all"
                >
                  {t('planning.canvas.addTaskToDay')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: DECIDIR NUEVO OBJETIVO */}
      <AnimatePresence>
        {showNewObjectiveModal && targetResultForObjective && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          >
            <motion.div
              initial={{ y: 40, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, scale: 0.96 }}
              className="w-full max-w-md rounded-[20px] border border-line bg-white p-5 shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <h3 className="text-[17px] font-bold text-ink">{t('planning.canvas.defineObjectiveTitle')}</h3>
                  <p className="text-[12px] text-ink-3">{t('planning.canvas.forResult', { name: targetResultForObjective.name })}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewObjectiveModal(false)}
                  className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-subtle"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateObjective} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    {t('planning.canvas.objectiveName')}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newObjectiveName}
                    onChange={(e) => setNewObjectiveName(e.target.value)}
                    placeholder={t('planning.canvas.objectiveNamePlaceholder')}
                    className="w-full rounded-[12px] border border-line px-3.5 py-2.5 text-[15px] outline-none focus:border-[#7a3fe0] focus:ring-1 focus:ring-[#7a3fe0]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    {t('planning.canvas.doneWhenOptional')}
                  </label>
                  <input
                    type="text"
                    value={newObjectiveDoneWhen}
                    onChange={(e) => setNewObjectiveDoneWhen(e.target.value)}
                    placeholder={t('planning.canvas.doneWhenPlaceholder')}
                    className="w-full rounded-[12px] border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-[#7a3fe0] focus:ring-1 focus:ring-[#7a3fe0]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newObjectiveName.trim()}
                  className="mt-2 w-full rounded-full bg-[#7a3fe0] py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#6832c7] active:scale-98 disabled:opacity-40 transition-all"
                >
                  {t('planning.canvas.saveObjective')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHEET: CREAR NUEVO RESULTADO EN ESTE PROYECTO */}
      {showResultForm && (
        <ResultFormSheet
          open={showResultForm}
          initialProjectName={currentProjectName}
          onClose={() => setShowResultForm(false)}
        />
      )}

      <ProjectFormSheet
        open={projectFormOpen}
        project={projectForm}
        onClose={() => {
          setProjectFormOpen(false)
          setProjectForm(undefined)
        }}
      />

      {/* Tactical Task Modal */}
      {selectedTacticalTaskId && (
        <TacticalTaskModal
          key={selectedTacticalTaskId}
          taskId={selectedTacticalTaskId}
          onClose={() => setSelectedTacticalTaskId(null)}
        />
      )}
    </div>
  )
}

/**
 * Modal Zoom Semántico para un Resultado
 */
function ResultZoomModal({
  result,
  objectives,
  tasks,
  onClose,
  onToggleTask,
  onAddStep,
  onAddObjective,
  onZoomObjective,
}: {
  result: Result
  objectives: Objective[]
  tasks: Task[]
  onClose: () => void
  onToggleTask: (t: Task) => void
  onAddStep: () => void
  onAddObjective: () => void
  onZoomObjective: (o: Objective) => void
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const projectColor = projectColorOfResult(state, result)
  const totalHours = tasks.reduce(
    (sum, task) => sum + (task.actualHours ?? task.estimatedHours ?? 1),
    0,
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
    >
      <div
        className="w-full max-w-lg rounded-[24px] border border-line bg-white p-6 shadow-2xl max-h-[88vh] flex flex-col relative overflow-hidden"
        style={{
          borderTopWidth: '5px',
          borderTopColor: projectColor,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-line">
          <div className="min-w-0 pr-3">
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md"
              style={{
                backgroundColor: `${projectColor}18`,
                color: projectColor,
              }}
            >
              <FolderGit2 className="size-3.5" />
              <span>{t('planning.canvas.projectOf', { name: result.projectName || 'La Obra Principal' })}</span>
            </div>
            <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-ink-3">
              {t('common.result')}
            </span>
            <h2 className="text-[20px] font-bold text-ink mt-0.5 truncate">
              {result.name}
            </h2>
            {result.why && (
              <p className="text-[12px] text-ink-3 italic mt-0.5">
                "{result.why}"
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-subtle"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Resumen */}
        <div className="my-3 flex items-center justify-between text-[12px] font-medium text-ink-3 bg-subtle p-2.5 rounded-[12px]">
          <span>
            {objectives.length} {t('common.objective')}
          </span>
          <span>·</span>
          <span>{t('planning.canvas.tasksTodayCount', { count: tasks.length, hours: totalHours })}</span>
        </div>

        {/* Cuerpo con scroll: Objetivos decididos + Tareas del día */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {/* Objetivos Decididos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
                {t('common.objective')}
              </span>
              <button
                type="button"
                onClick={onAddObjective}
                className="text-[12px] font-semibold flex items-center gap-1 hover:underline"
                style={{ color: projectColor }}
              >
                <Plus className="size-3" />
                <span>{t('planning.defineObjective')}</span>
              </button>
            </div>

            {objectives.length === 0 ? (
              <div className="p-3 rounded-[12px] border border-dashed border-line text-center text-[12px] text-ink-3">
                {t('planning.emptyResultObjectives')}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {objectives.map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => onZoomObjective(obj)}
                    className="flex items-center justify-between rounded-[12px] border border-line bg-subtle/50 px-3 py-2 cursor-pointer transition-colors hover:bg-subtle"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: projectColor }}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3">
                          {t('common.objective')}
                        </p>
                        <p className="text-[13px] font-bold text-ink truncate hover:underline">
                          {obj.name}
                        </p>
                        {obj.doneWhen && (
                          <p className="text-[11px] text-ink-3 truncate">
                            {t('home.doneWhen', { text: obj.doneWhen })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Maximize2 className="size-3.5 text-ink-4 shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tareas programadas hoy para este resultado */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
                {t('planning.canvas.tasksTodayForResult')}
              </span>
              <button
                type="button"
                onClick={onAddStep}
                className="text-[12px] font-semibold flex items-center gap-1 hover:underline"
                style={{ color: projectColor }}
              >
                <Plus className="size-3" />
                <span>{t('common.task')}</span>
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="p-4 rounded-[12px] border border-dashed border-line text-center text-[12px] text-ink-3">
                {t('planning.canvas.noTasksInResult')}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {tasks.map((t) => (
                  <TaskStepRow
                    key={t.id}
                    task={t}
                    onToggle={() => onToggleTask(t)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-line flex items-center justify-between">
          <button
            type="button"
            onClick={onAddStep}
            className="flex items-center gap-1.5 text-[13px] font-semibold hover:underline"
            style={{ color: projectColor }}
          >
            <Plus className="size-4" />
            <span>{t('planning.canvas.addTaskToDay')}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-subtle px-4 py-2 text-[13px] font-semibold text-ink-2 hover:bg-line-strong/30"
          >
            {t('planning.canvas.closeZoom')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Fila de un paso dentro del lienzo con punto cromático discreto
 */
function TaskStepRow({
  task,
  onToggle,
  onOpenTactical,
}: {
  task: Task
  onToggle: () => void
  onOpenTactical?: () => void
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const objective = objectiveById(state, task.objectiveId)
  const done = isTaskDone(task.status)
  const tInfo = TERRENO_MAP[task.terreno ?? 'literatura']

  return (
    <div className="group flex items-center justify-between gap-2 rounded-[12px] border border-line/60 bg-subtle/40 px-3 py-2 transition-colors hover:bg-subtle/80">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={onToggle}
          className={`flex size-5 shrink-0 items-center justify-center rounded-[5px] border-2 transition-all ${
            done
              ? 'border-[#0f9f6e] bg-[#0f9f6e] text-white'
              : 'border-line-strong hover:border-ink'
          }`}
        >
          {done && <Check className="size-3 stroke-[3]" />}
        </button>

        {/* Punto cromático orgánico del paso */}
        <span
          className="size-1.5 rounded-full shrink-0"
          style={{ backgroundColor: tInfo.color }}
          title={tInfo.label}
        />

        <div
          onClick={onOpenTactical}
          className="min-w-0 flex-1 cursor-pointer"
          title={t('planning.canvas.openTactical')}
        >
          {objective ? (
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3 truncate">
              {t('common.objective')} · {objective.name}
            </p>
          ) : null}
          <p className="flex min-w-0 items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3 shrink-0">
              {t('common.task')}
            </span>
            <span
              className={`text-[13px] font-medium truncate ${
                done ? 'line-through text-ink-3' : 'text-ink'
              } hover:text-purple-700 transition-colors`}
            >
              {task.title}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {onOpenTactical && (
          <button
            type="button"
            onClick={onOpenTactical}
            className="opacity-0 group-hover:opacity-100 p-1 text-ink-3 hover:text-purple-700 rounded transition-all"
            title={t('home.clock.openTactical')}
          >
            <SlidersHorizontal className="size-3" />
          </button>
        )}
        <span className="text-[11px] font-semibold text-ink-3">
          {task.actualHours ?? task.estimatedHours}h
        </span>
      </div>
    </div>
  )
}

/**
 * Modal Zoom Semántico para un Objetivo Decidido
 */
function ObjectiveZoomModal({
  objective,
  resultName,
  tasks,
  onClose,
  onToggleTask,
  onAddStep,
}: {
  objective: Objective
  resultName: string
  tasks: Task[]
  onClose: () => void
  onToggleTask: (t: Task) => void
  onAddStep: () => void
}) {
  const { t } = useTranslation()
  const totalHours = tasks.reduce(
    (sum, task) => sum + (task.actualHours ?? task.estimatedHours ?? 1),
    0,
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-lg rounded-[24px] border border-line bg-white p-6 shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between pb-3 border-b border-line">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              {t('common.result')} · {resultName}
            </span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-ink-3">
              {t('common.objective')}
            </span>
            <h3 className="text-[19px] font-bold text-ink mt-0.5">
              {objective.name}
            </h3>
            {objective.doneWhen && (
              <p className="text-[12px] text-ink-2 mt-0.5 italic">
                {t('planning.canvas.criteria', { text: objective.doneWhen })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-subtle"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="my-3 flex items-center justify-between text-[12px] font-medium text-ink-3 bg-subtle p-2.5 rounded-[12px]">
          <span>{t('planning.canvas.tasksToday', { count: tasks.length })}</span>
          <span>{t('planning.canvas.dedication', { hours: totalHours })}</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-ink-3">
              <p className="text-[14px]">{t('planning.canvas.noTasksInObjective')}</p>
              <button
                type="button"
                onClick={onAddStep}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#7a3fe0] px-4 py-2 text-[13px] font-semibold text-white shadow-xs"
              >
                <Plus className="size-4" />
                <span>{t('planning.canvas.addFirstTask')}</span>
              </button>
            </div>
          ) : (
            tasks.map((task) => {
              const done = isTaskDone(task.status)
              const tInfo = TERRENO_MAP[task.terreno ?? 'literatura']
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-[14px] border border-line bg-subtle/50 p-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleTask(task)}
                      className={`flex size-5 shrink-0 items-center justify-center rounded-[5px] border-2 transition-all ${
                        done
                          ? 'border-[#0f9f6e] bg-[#0f9f6e] text-white'
                          : 'border-line-strong hover:border-ink'
                      }`}
                    >
                      {done && <Check className="size-3 stroke-[3]" />}
                    </button>
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: tInfo.color }}
                      title={tInfo.label}
                    />
                    <span className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-3">
                        {t('common.task')}
                      </span>
                      <span
                        className={`text-[14px] font-semibold truncate block ${
                          done ? 'line-through text-ink-3' : 'text-ink'
                        }`}
                      >
                        {task.title}
                      </span>
                    </span>
                  </div>
                  <span className="text-[12px] font-bold text-ink-3 ml-2">
                    {task.actualHours ?? task.estimatedHours}h
                  </span>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-3 mt-2 border-t border-line flex items-center justify-between">
          <button
            type="button"
            onClick={onAddStep}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[#7a3fe0]"
          >
            <Plus className="size-4" />
            <span>{t('planning.canvas.addTaskToObjective')}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-subtle px-4 py-2 text-[13px] font-semibold text-ink-2 hover:bg-line-strong/30"
          >
            {t('planning.canvas.closeZoom')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Modal de Presentación Filosófica de la Obra
 * Explica las 3 dimensiones vivas para que quede comprendido sin necesidad de etiquetar todo.
 */
function PhilosophyPresentationModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md rounded-[24px] border border-line bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#7a3fe0]" />
            <h3 className="text-[17px] font-bold text-ink">{t('planning.canvas.philosophyTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-subtle"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
          <Trans i18nKey="planning.canvas.philosophy.intro" components={{ strong: <strong /> }} />
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3 rounded-[14px] bg-[#f5f0ff]/60 border border-[#7a3fe0]/20 p-3">
            <span className="mt-1 size-2.5 rounded-full bg-[#7a3fe0] shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-ink">{t('planning.canvas.philosophy.literaturaTitle')}</h4>
              <p className="text-[12px] text-ink-2 mt-0.5">
                {t('planning.canvas.philosophy.literaturaBody')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[14px] bg-[#eef2ff]/60 border border-[#4f46e5]/20 p-3">
            <span className="mt-1.5 size-2.5 rounded-full bg-[#4f46e5] shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-ink">{t('planning.canvas.philosophy.arteTitle')}</h4>
              <p className="text-[12px] text-ink-2 mt-0.5">
                {t('planning.canvas.philosophy.arteBody')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[14px] bg-[#ecfdf5]/60 border border-[#0f9f6e]/20 p-3">
            <span className="mt-1.5 size-2.5 rounded-full bg-[#0f9f6e] shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-ink">{t('planning.canvas.philosophy.empresaTitle')}</h4>
              <p className="text-[12px] text-ink-2 mt-0.5">
                {t('planning.canvas.philosophy.empresaBody')}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-ink-3 italic">
          {t('planning.canvas.philosophy.outro')}
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-[#7a3fe0] py-2.5 text-[14px] font-semibold text-white hover:bg-[#6832c7] transition-all"
          >
            {t('planning.canvas.understood')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
