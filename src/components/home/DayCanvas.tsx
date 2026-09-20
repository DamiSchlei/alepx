import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft,
  Plus,
  Check,
  Sparkles,
  LayoutList,
  Compass,
  X,
  Target,
  Maximize2,
  FolderGit2,
  SlidersHorizontal,
} from 'lucide-react'
import { DayTaskViewer } from '@/components/home/DayTaskViewer'
import { DayTacticalDashboard } from '@/components/home/DayTacticalDashboard'
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
  objectivesOfResult,
  projectColorOfResult,
  tasksForDay,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { parseLocal } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { TERRENO_MAP, TERRENOS } from '@/domain/terrenos'
import { formatHours } from '@/i18n/format'
import type { Objective, Result, Task, Terreno } from '@/domain/types'

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
  const state = useAleph()
  const locale = state.character.locale
  const cap = state.character.dailyHourCap ?? 5
  const tasks = tasksForDay(state, dayKey)
  const results = activeResults(state)
  const projects = allProjects(state)

  // Map of Projects -> Results produced inside
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

  const activeProjectColor = useMemo(() => {
    const projects = allProjects(state)
    const p = projects.find(
      (proj) => proj.name.trim().toLowerCase() === currentProjectName.trim().toLowerCase(),
    )
    return p?.color || '#7a3fe0'
  }, [state, currentProjectName])

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
  const dayName = new Intl.DateTimeFormat(localeTag, { weekday: 'long' }).format(dateObj)
  const dayNum = dateObj.getDate()
  const monthName = new Intl.DateTimeFormat(localeTag, { month: 'long' }).format(dateObj)
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
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-line z-20">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Volver al carrusel"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-subtle text-ink-2 hover:text-ink hover:border-line-strong active:scale-95 transition-all text-[13px] font-medium"
          >
            <ArrowLeft className="size-4" />
            <span>Carrusel</span>
          </button>
          <div>
            <h1 className="text-[15px] font-bold capitalize leading-tight flex items-center gap-1.5">
              <span>{`${dayName} ${dayNum} de ${monthName}`}</span>
              {isToday && (
                <span className="rounded-full bg-[#f5f0ff] px-2 py-0.5 text-[10px] font-semibold text-[#7a3fe0]">
                  Hoy
                </span>
              )}
            </h1>
            <p className="text-[11px] font-medium text-ink-3">
              {formatHours(planned, locale)} h cargadas · {formatHours(free, locale)} h libres
            </p>
          </div>
        </div>

        {/* Action icons & view switcher */}
        <div className="flex items-center gap-2">
          {/* Botón de la Filosofía del Recorrido (explicación de los 3 movimientos) */}
          <button
            type="button"
            onClick={() => setShowPhilosophyModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-line bg-white text-ink-2 hover:text-[#7a3fe0] hover:border-[#7a3fe0]/40 text-[12px] font-medium transition-all shadow-2xs"
            title="Ver filosofía del recorrido"
          >
            <Sparkles className="size-3.5 text-[#7a3fe0]" />
            <span className="hidden sm:inline">El Recorrido</span>
          </button>

          {/* View switcher */}
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
              <span>Lienzo</span>
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
              <span>Lista</span>
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
              <span>Táctica</span>
            </button>
          </div>

          {/* Añadir tarea */}
          <button
            type="button"
            onClick={() => handleOpenSeed()}
            className="flex size-9 items-center justify-center rounded-full bg-[#7a3fe0] text-white hover:bg-[#6832c7] active:scale-95 transition-all shadow-sm"
            title="Añadir tarea"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative">
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
          /* CANVAS ESPACIAL: La Obra y sus Objetivos Decididos */
          <div className="min-h-full flex flex-col items-center justify-start p-4 relative max-w-xl mx-auto pb-28">
            {/* SVG Filamentos conectores sutiles */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              style={{ minHeight: '680px' }}
            >
              <defs>
                <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7a3fe0" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0f9f6e" stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </svg>

            {/* NÚCLEO CENTRAL: EL PROYECTO */}
            <div className="w-full z-10 my-4 flex flex-col items-center text-center">
              <motion.div
                animate={{ scale: [1, 1.015, 1] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-line bg-white/95 px-6 py-4 shadow-sm backdrop-blur-sm max-w-md w-full"
              >
                {/* Indicador y Selector de Proyecto */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${activeProjectColor}18`,
                      color: activeProjectColor,
                    }}
                  >
                    <FolderGit2 className="size-3" />
                    <span>Proyecto</span>
                  </span>
                  {projectNames.length > 1 && (
                    <select
                      value={currentProjectName}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="text-[12px] font-bold bg-transparent outline-none cursor-pointer border-b border-dashed"
                      style={{
                        color: activeProjectColor,
                        borderColor: `${activeProjectColor}60`,
                      }}
                    >
                      {projectNames.map((pName) => (
                        <option key={pName} value={pName}>
                          {pName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <h2 className="font-display text-[20px] font-bold text-ink leading-snug">
                  {currentProjectName}
                </h2>

                {/* Resumen del Proyecto en el día */}
                <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-ink-3 border-t border-line/60 pt-2 w-full justify-center">
                  <span>
                    {resultsInCurrentProject.length}{' '}
                    {resultsInCurrentProject.length === 1
                      ? 'resultado producido'
                      : 'resultados producidos'}
                  </span>
                  <span>·</span>
                  <span>
                    {
                      tasks.filter(
                        (t) =>
                          t.resultId &&
                          resultsInCurrentProject.some((r) => r.id === t.resultId),
                      ).length
                    }{' '}
                    tareas para hoy
                  </span>
                </div>
              </motion.div>
            </div>

            {/* SECCIÓN: RESULTADOS PRODUCIDOS DENTRO DEL PROYECTO */}
            <div className="w-full z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <span className="text-[12px] font-bold tracking-wider uppercase text-ink-3 flex items-center gap-1.5">
                    <Target className="size-3.5 text-ink-2" />
                    <span>Resultados Producidos dentro</span>
                  </span>
                  <p className="text-[11px] text-ink-3">
                    Lo que se concreta dentro de {currentProjectName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResultForm(true)}
                  className="flex items-center gap-1 text-[12px] font-semibold transition-colors px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${activeProjectColor}18`,
                    color: activeProjectColor,
                  }}
                >
                  <Plus className="size-3.5" />
                  <span>Nuevo resultado</span>
                </button>
              </div>

              {/* Si no hay resultados en este proyecto aún */}
              {resultsInCurrentProject.length === 0 && (
                <div className="rounded-[20px] border border-dashed border-line bg-white/80 p-6 text-center">
                  <p className="text-[14px] font-medium text-ink-2">
                    Aún no definiste resultados específicos para este proyecto.
                  </p>
                  <p className="mt-1 text-[12px] text-ink-3">
                    El proyecto es el marco; los resultados son las obras tangibles que se producen dentro.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowResultForm(true)}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-xs"
                      style={{ backgroundColor: activeProjectColor }}
                    >
                      <Plus className="size-4" />
                      <span>Crear primer resultado en este proyecto</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de células de Resultados Producidos */}
              {resultsInCurrentProject.map((res) => {
                const resObjectives = objectivesOfResult(state, res.id)
                const resTasks = tasks.filter((t) => t.resultId === res.id)

                return (
                  <ResultCellCard
                    key={res.id}
                    result={res}
                    objectives={resObjectives}
                    tasks={resTasks}
                    onToggleTask={handleToggleTask}
                    onZoomResult={() => setZoomedResult(res)}
                    onZoomObjective={(obj) => {
                      setZoomedObjective(obj)
                      setZoomedObjectiveResultName(res.name)
                    }}
                    onAddStep={(objId) => handleOpenSeed(res.id, objId)}
                    onAddObjective={() => handleOpenNewObjective(res)}
                    onOpenTacticalTask={(taskId) => setSelectedTacticalTaskId(taskId)}
                  />
                )
              })}

              {/* Tareas sueltas sin resultado asociado */}
              {tasks.filter(
                (t) =>
                  !t.resultId ||
                  !resultsInCurrentProject.some((r) => r.id === t.resultId),
              ).length > 0 && (
                <div className="relative flex flex-col rounded-[20px] border border-line bg-white/95 p-4 shadow-xs transition-all hover:shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-line/60">
                    <div>
                      <h3 className="text-[14px] font-bold text-ink">
                        Tareas sueltas del día
                      </h3>
                      <p className="text-[11px] text-ink-3">
                        Acciones que caminan de forma libre
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSeed()}
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#7a3fe0] px-2.5 py-1 rounded-full bg-[#f5f0ff]"
                    >
                      <Plus className="size-3" />
                      <span>+ Tarea</span>
                    </button>
                  </div>

                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {tasks
                      .filter(
                        (t) =>
                          !t.resultId ||
                          !resultsInCurrentProject.some(
                            (r) => r.id === t.resultId,
                          ),
                      )
                      .map((t) => (
                        <TaskStepRow
                          key={t.id}
                          task={t}
                          onToggle={() => handleToggleTask(t)}
                          onOpenTactical={() => setSelectedTacticalTaskId(t.id)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ZOOM SEMÁNTICO EN EL RESULTADO PRODUCIDO */}
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
            resultName={zoomedObjectiveResultName || 'Resultado'}
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
                  <h3 className="text-[17px] font-bold text-ink">Añadir tarea al día</h3>
                  <p className="text-[12px] text-ink-3">
                    {`${dayName} ${dayNum} de ${monthName}`} · {currentProjectName}
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
                {/* Selección del Resultado Producido */}
                <div>
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    Resultado Producido
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
                    Hito / Objetivo específico (opcional)
                  </label>
                  <select
                    value={seedObjectiveId || ''}
                    onChange={(e) => setSeedObjectiveId(e.target.value || undefined)}
                    className="w-full rounded-[12px] border border-line px-3.5 py-2.5 text-[14px] font-medium bg-white text-ink outline-none focus:border-[#7a3fe0] focus:ring-1 focus:ring-[#7a3fe0]"
                  >
                    <option value="">Directo al resultado (sin objetivo intermedio)</option>
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
                    ¿Qué vas a hacer?
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={seedTitle}
                    onChange={(e) => setSeedTitle(e.target.value)}
                    placeholder="Ej. Escribir propuesta / Definir precio..."
                    className="w-full rounded-[12px] border border-line px-3.5 py-2.5 text-[15px] outline-none focus:border-[#7a3fe0] focus:ring-1 focus:ring-[#7a3fe0]"
                  />
                </div>

                {/* Horas estimadas */}
                <div>
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    Tiempo estimado
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
                    Enfoque de la acción
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TERRENOS.map((terrId) => {
                      const tInfo = TERRENO_MAP[terrId]
                      const active = seedTerreno === terrId
                      const verb =
                        terrId === 'literatura'
                          ? 'Decidir'
                          : terrId === 'arte'
                            ? 'Atravesar'
                            : 'Concretar'
                      const sub =
                        terrId === 'literatura'
                          ? 'regla / acuerdo'
                          : terrId === 'arte'
                            ? 'límite interno'
                            : 'materia tangible'

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
                  Añadir tarea a este día
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
                  <h3 className="text-[17px] font-bold text-ink">Decidir nuevo objetivo</h3>
                  <p className="text-[12px] text-ink-3">Para: {targetResultForObjective.name}</p>
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
                    Nombre del objetivo
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newObjectiveName}
                    onChange={(e) => setNewObjectiveName(e.target.value)}
                    placeholder="Ej. Oferta visible / Catálogo listo..."
                    className="w-full rounded-[12px] border border-line px-3.5 py-2.5 text-[15px] outline-none focus:border-[#7a3fe0] focus:ring-1 focus:ring-[#7a3fe0]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                    ¿Cuándo está listo? (opcional)
                  </label>
                  <input
                    type="text"
                    value={newObjectiveDoneWhen}
                    onChange={(e) => setNewObjectiveDoneWhen(e.target.value)}
                    placeholder="Criterio claro de completitud..."
                    className="w-full rounded-[12px] border border-line px-3.5 py-2.5 text-[14px] outline-none focus:border-[#7a3fe0] focus:ring-1 focus:ring-[#7a3fe0]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newObjectiveName.trim()}
                  className="mt-2 w-full rounded-full bg-[#7a3fe0] py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#6832c7] active:scale-98 disabled:opacity-40 transition-all"
                >
                  Guardar objetivo decidido
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
 * Célula de Resultado Producido en el Lienzo
 */
function ResultCellCard({
  result,
  objectives,
  tasks,
  onToggleTask,
  onZoomResult,
  onZoomObjective,
  onAddStep,
  onAddObjective,
  onOpenTacticalTask,
}: {
  result: Result
  objectives: Objective[]
  tasks: Task[]
  onToggleTask: (t: Task) => void
  onZoomResult: () => void
  onZoomObjective: (o: Objective) => void
  onAddStep: (objId?: string) => void
  onAddObjective: () => void
  onOpenTacticalTask?: (taskId: string) => void
}) {
  const state = useAleph()
  const projectColor = projectColorOfResult(state, result)
  const hours = tasks.reduce(
    (sum, t) => sum + (t.actualHours ?? t.estimatedHours ?? 1),
    0,
  )

  return (
    <div
      className="relative flex flex-col rounded-[22px] border border-line bg-white/95 p-4 shadow-xs transition-all hover:border-line-strong hover:shadow-md overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${projectColor}0a 0%, #ffffff 45%)`,
        borderLeftWidth: '4px',
        borderLeftColor: projectColor,
      }}
    >
      {/* Header de la Célula de Resultado */}
      <div className="flex items-start justify-between pb-3 border-b border-line/60">
        <div className="min-w-0 flex-1 pr-2">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{
              backgroundColor: `${projectColor}18`,
              color: projectColor,
            }}
          >
            Resultado Producido
          </span>
          <h3
            onClick={onZoomResult}
            className="text-[16px] font-bold text-ink hover:underline cursor-pointer transition-colors leading-tight truncate flex items-center gap-1.5 group"
          >
            <span>{result.name}</span>
            <Maximize2 className="size-3 text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </h3>
          {result.why && (
            <p className="text-[11px] text-ink-3 truncate mt-0.5 italic">
              "{result.why}"
            </p>
          )}
          <p className="text-[11px] font-medium text-ink-3 mt-1">
            {objectives.length} objetivos decididos · {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'} hoy ({hours}h)
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onZoomResult}
            className="flex items-center gap-1 text-[11px] font-semibold text-ink-3 hover:text-ink px-2.5 py-1 rounded-full border border-line bg-subtle transition-all"
            title="Ver estructura completa del resultado"
          >
            <Maximize2 className="size-3" />
            <span>Zoom</span>
          </button>
          <button
            type="button"
            onClick={() => onAddStep()}
            className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full transition-colors"
            style={{
              backgroundColor: `${projectColor}16`,
              color: projectColor,
            }}
          >
            <Plus className="size-3" />
            <span>+ Tarea</span>
          </button>
        </div>
      </div>

      {/* Objetivos Decididos dentro de este resultado (si existen) */}
      {objectives.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
              Objetivos Decididos
            </span>
            <button
              type="button"
              onClick={onAddObjective}
              className="text-[11px] font-semibold hover:underline"
              style={{ color: projectColor }}
            >
              + Decidir otro
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {objectives.map((obj) => {
              const objTasks = tasks.filter((t) => t.objectiveId === obj.id)
              return (
                <div
                  key={obj.id}
                  className="flex items-center justify-between rounded-[12px] border border-line/50 bg-subtle/30 px-2.5 py-1.5 group hover:bg-subtle/70 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onZoomObjective(obj)}
                    className="flex items-center gap-2 min-w-0 text-left flex-1 pr-2"
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: projectColor }}
                    />
                    <span className="text-[13px] font-medium text-ink truncate group-hover:underline">
                      {obj.name}
                    </span>
                    <span className="text-[11px] text-ink-3 shrink-0">
                      ({objTasks.length} {objTasks.length === 1 ? 'tarea' : 'tareas'})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddStep(obj.id)}
                    className="text-[11px] font-semibold hover:underline shrink-0"
                    style={{ color: projectColor }}
                  >
                    + Tarea
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tareas del día hacia este resultado */}
      <div className="mt-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3 block mb-1.5 px-0.5">
          Tareas para hoy
        </span>
        {tasks.length === 0 ? (
          <div className="py-2 px-3 rounded-[10px] bg-subtle/20 border border-dashed border-line text-center text-[12px] text-ink-4">
            Sin tareas programadas para hoy.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {tasks.map((t) => (
              <TaskStepRow
                key={t.id}
                task={t}
                onToggle={() => onToggleTask(t)}
                onOpenTactical={() => onOpenTacticalTask?.(t.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer con acciones rápidas */}
      <div className="mt-3.5 pt-2.5 border-t border-line/60 flex items-center justify-between text-[12px]">
        <button
          type="button"
          onClick={onAddObjective}
          className="text-ink-3 hover:text-ink font-medium transition-colors"
        >
          + Decidir objetivo
        </button>
        <button
          type="button"
          onClick={() => onAddStep()}
          className="text-[#7a3fe0] hover:text-[#6832c7] font-semibold transition-colors"
        >
          + Añadir tarea
        </button>
      </div>
    </div>
  )
}

/**
 * Modal Zoom Semántico para un Resultado Producido
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
  const state = useAleph()
  const projectColor = projectColorOfResult(state, result)
  const totalHours = tasks.reduce(
    (sum, t) => sum + (t.actualHours ?? t.estimatedHours ?? 1),
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
              <span>Proyecto: {result.projectName || 'La Obra Principal'}</span>
            </div>
            <h2 className="text-[20px] font-bold text-ink mt-1 truncate">
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
          <span>{objectives.length} objetivos decididos</span>
          <span>·</span>
          <span>{tasks.length} tareas hoy ({totalHours}h)</span>
        </div>

        {/* Cuerpo con scroll: Objetivos decididos + Tareas del día */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          {/* Objetivos Decididos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
                Objetivos decididos dentro
              </span>
              <button
                type="button"
                onClick={onAddObjective}
                className="text-[12px] font-semibold flex items-center gap-1 hover:underline"
                style={{ color: projectColor }}
              >
                <Plus className="size-3" />
                <span>Decidir objetivo</span>
              </button>
            </div>

            {objectives.length === 0 ? (
              <div className="p-3 rounded-[12px] border border-dashed border-line text-center text-[12px] text-ink-3">
                Sin objetivos específicos aún en este resultado.
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
                        <p className="text-[13px] font-bold text-ink truncate hover:underline">
                          {obj.name}
                        </p>
                        {obj.doneWhen && (
                          <p className="text-[11px] text-ink-3 truncate">
                            Listo cuando: {obj.doneWhen}
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
                Tareas del día para este resultado
              </span>
              <button
                type="button"
                onClick={onAddStep}
                className="text-[12px] font-semibold flex items-center gap-1 hover:underline"
                style={{ color: projectColor }}
              >
                <Plus className="size-3" />
                <span>+ Tarea</span>
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="p-4 rounded-[12px] border border-dashed border-line text-center text-[12px] text-ink-3">
                Sin tareas programadas para hoy en este resultado.
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
            <span>Añadir tarea para hoy</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-subtle px-4 py-2 text-[13px] font-semibold text-ink-2 hover:bg-line-strong/30"
          >
            Cerrar zoom
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

        <span
          onClick={onOpenTactical}
          className={`text-[13px] font-medium truncate cursor-pointer hover:text-purple-700 transition-colors ${
            done ? 'line-through text-ink-3' : 'text-ink'
          }`}
          title="Abrir estudio táctico"
        >
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {onOpenTactical && (
          <button
            type="button"
            onClick={onOpenTactical}
            className="opacity-0 group-hover:opacity-100 p-1 text-ink-3 hover:text-purple-700 rounded transition-all"
            title="Abrir táctica y producción"
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
  const totalHours = tasks.reduce(
    (sum, t) => sum + (t.actualHours ?? t.estimatedHours ?? 1),
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
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-line">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              {resultName}
            </span>
            <h3 className="text-[19px] font-bold text-ink mt-0.5">
              {objective.name}
            </h3>
            {objective.doneWhen && (
              <p className="text-[12px] text-ink-2 mt-0.5 italic">
                Criterio: {objective.doneWhen}
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

        {/* Resumen */}
        <div className="my-3 flex items-center justify-between text-[12px] font-medium text-ink-3 bg-subtle p-2.5 rounded-[12px]">
          <span>Tareas programadas hoy: {tasks.length}</span>
          <span>Dedicación: {totalHours} h</span>
        </div>

        {/* Lista de tareas */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-ink-3">
              <p className="text-[14px]">No hay tareas para este objetivo hoy.</p>
              <button
                type="button"
                onClick={onAddStep}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#7a3fe0] px-4 py-2 text-[13px] font-semibold text-white shadow-xs"
              >
                <Plus className="size-4" />
                <span>Añadir primera tarea</span>
              </button>
            </div>
          ) : (
            tasks.map((t) => {
              const done = isTaskDone(t.status)
              const tInfo = TERRENO_MAP[t.terreno ?? 'literatura']
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-[14px] border border-line bg-subtle/50 p-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleTask(t)}
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
                    <span
                      className={`text-[14px] font-semibold truncate ${
                        done ? 'line-through text-ink-3' : 'text-ink'
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>
                  <span className="text-[12px] font-bold text-ink-3 ml-2">
                    {t.actualHours ?? t.estimatedHours}h
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-2 border-t border-line flex items-center justify-between">
          <button
            type="button"
            onClick={onAddStep}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[#7a3fe0]"
          >
            <Plus className="size-4" />
            <span>Añadir tarea para este objetivo</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-subtle px-4 py-2 text-[13px] font-semibold text-ink-2 hover:bg-line-strong/30"
          >
            Cerrar zoom
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
            <h3 className="text-[17px] font-bold text-ink">El Recorrido de la Obra</h3>
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
          Tus proyectos avanzan mediante acciones cotidianas. Cada tarea que realizás hacia tus <strong>proyectos y objetivos</strong> nutre tres dimensiones fundamentales:
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3 rounded-[14px] bg-[#f5f0ff]/60 border border-[#7a3fe0]/20 p-3">
            <span className="mt-1 size-2.5 rounded-full bg-[#7a3fe0] shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-ink">Literatura (Decidir y nombrar)</h4>
              <p className="text-[12px] text-ink-2 mt-0.5">
                Lo que nombra, acuerda y da estructura: reglas, tiempos, condiciones y compromisos.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[14px] bg-[#eef2ff]/60 border border-[#4f46e5]/20 p-3">
            <span className="mt-1.5 size-2.5 rounded-full bg-[#4f46e5] shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-ink">Arte (El roce interno)</h4>
              <p className="text-[12px] text-ink-2 mt-0.5">
                La acción que atraviesa la postura y el límite propio: sostener el precio, superar el rechazo, quién estás siendo.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[14px] bg-[#ecfdf5]/60 border border-[#0f9f6e]/20 p-3">
            <span className="mt-1.5 size-2.5 rounded-full bg-[#0f9f6e] shrink-0" />
            <div>
              <h4 className="text-[13px] font-bold text-ink">Empresa (La materia concreta)</h4>
              <p className="text-[12px] text-ink-2 mt-0.5">
                Lo que imprime en la realidad tangible: el producto listo, los números, la entrega y los hechos.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-ink-3 italic">
          En tu día a día, esto no son rótulos burocráticos: es la textura viva con la que avanzas hacia tus objetivos decididos.
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-[#7a3fe0] py-2.5 text-[14px] font-semibold text-white hover:bg-[#6832c7] transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </motion.div>
  )
}
