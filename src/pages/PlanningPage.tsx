import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FolderPlus, GitFork, Layers, ListTodo } from 'lucide-react'
import { GlobalHierarchyTree } from '@/components/planning/GlobalHierarchyTree'
import { ObjectiveFormSheet } from '@/components/planning/ObjectiveForm'
import { ProjectCarousel } from '@/components/planning/ProjectCarousel'
import { ProjectFormSheet } from '@/components/planning/ProjectFormSheet'
import { ProjectHierarchyView } from '@/components/planning/ProjectHierarchyView'
import { ResultFormSheet } from '@/components/planning/ResultForm'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { AssignSheet } from '@/components/task/AssignSheet'
import { TacticalTaskModal } from '@/components/task/TacticalTaskModal'
import { TaskRow } from '@/components/task/TaskRow'
import { useTaskActions } from '@/components/task/useTaskActions'
import { useTaskCompletion } from '@/components/task/useTaskCompletion'
import {
  Button,
  Chip,
  EmptyState,
  Input,
  Page,
  Select,
} from '@/components/ui/primitives'
import { ConfirmDialog, Sheet } from '@/components/ui/Sheet'
import { SaberProgressBar } from '@/components/ui/SaberProgressBar'
import { archiveResult, restoreResult } from '@/data/actions'
import {
  activeResults,
  allProjects,
  attendingResults,
  leastActiveAttending,
  pickerObjectives,
  pickerResults,
  projectOfTask,
  resultsOfProject,
  taskResultStatus,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { shouldSoftWarnActiveResults } from '@/domain/limits'
import { STAGE_ORDER } from '@/domain/stage'
import { skillName } from '@/i18n/labels'
import type { Project, Result, StageId, Task, TaskStatus } from '@/domain/types'

type PlanningViewMode = 'project' | 'tree' | 'tasks'

export function PlanningPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()

  const projects = allProjects(state)
  const results = activeResults(state)
  const attendingCount = attendingResults(state).length
  const archived = state.results.filter((r) => r.status === 'archived')

  // Selected project state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id ?? 'proj_obra_principal',
  )
  const [viewMode, setViewMode] = useState<PlanningViewMode>('project')

  // Active project object
  const activeProject = useMemo(() => {
    return (
      projects.find((p) => p.id === selectedProjectId) ||
      projects[0] || {
        id: 'proj_default',
        name: 'La Obra Principal',
        color: '#7a3fe0',
        createdAt: new Date().toISOString(),
      }
    )
  }, [projects, selectedProjectId])

  // Results for the currently active project
  const projectResults = useMemo(() => {
    return resultsOfProject(state, activeProject.name)
  }, [state, activeProject.name])

  // Modals state
  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()

  const [resultFormOpen, setResultFormOpen] = useState(false)
  const [resultSeedProject, setResultSeedProject] = useState<string | undefined>()
  const [resultSeedName, setResultSeedName] = useState<string | undefined>()

  const [objectiveFormOpen, setObjectiveFormOpen] = useState(false)
  const [targetResultForObj, setTargetResultForObj] = useState<Result | undefined>()

  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [taskPreset, setTaskPreset] = useState<{ resultId?: string; objectiveId?: string }>({})

  const [capOpen, setCapOpen] = useState(false)
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [selectedTacticalTaskId, setSelectedTacticalTaskId] = useState<string | null>(null)

  // Project modal handlers
  const handleNewProject = () => {
    setEditingProject(undefined)
    setProjectFormOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setProjectFormOpen(true)
  }

  // Result modal handlers
  const handleNewResult = (projectName?: string) => {
    if (shouldSoftWarnActiveResults(attendingCount)) {
      setResultSeedProject(projectName ?? activeProject.name)
      setCapOpen(true)
      return
    }
    setResultSeedProject(projectName ?? activeProject.name)
    setResultFormOpen(true)
  }

  // Objective modal handlers
  const handleNewObjective = (result: Result) => {
    setTargetResultForObj(result)
    setObjectiveFormOpen(true)
  }

  // Task modal handlers
  const handleNewTask = (resultId: string, objectiveId?: string) => {
    setTaskPreset({ resultId, objectiveId })
    setTaskFormOpen(true)
  }

  const writeJournal = () => {
    setCapOpen(false)
    const target = leastActiveAttending(state)
    if (target) navigate(`/planning/results/${target.id}`)
  }

  return (
    <Page className="flex flex-col gap-4 pt-1 pb-16">
      {/* HEADER / CHROME (matching Home Principal aesthetic) */}
      <div className="flex flex-col gap-3 border-b border-line/60 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-[22px] font-bold text-ink tracking-tight">
              Planificación
            </h1>
            <p className="text-[12px] text-ink-3">
              Proyectos · Resultados producidos · Objetivos · Tareas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleNewProject}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 shadow-sm"
            >
              <FolderPlus className="size-4" />
              <span>Definir Proyecto</span>
            </Button>
          </div>
        </div>

        {/* VIEW SELECTOR PILLS */}
        <div className="flex items-center gap-2 pt-1">
          <Chip
            active={viewMode === 'project'}
            onClick={() => setViewMode('project')}
            className="flex items-center gap-1.5 px-3 py-1 text-[13px]"
          >
            <Layers className="size-3.5" />
            <span>Por Proyecto</span>
          </Chip>
          <Chip
            active={viewMode === 'tree'}
            onClick={() => setViewMode('tree')}
            className="flex items-center gap-1.5 px-3 py-1 text-[13px]"
          >
            <GitFork className="size-3.5" />
            <span>Árbol Integral</span>
          </Chip>
          <Chip
            active={viewMode === 'tasks'}
            onClick={() => setViewMode('tasks')}
            className="flex items-center gap-1.5 px-3 py-1 text-[13px]"
          >
            <ListTodo className="size-3.5" />
            <span>Lista Integral</span>
          </Chip>
        </div>
      </div>

      {/* VIEW MODE CONTENT */}
      {viewMode === 'project' && (
        <div className="flex flex-col gap-4">
          {/* PROJECT SELECTOR CAROUSEL */}
          <ProjectCarousel
            projects={projects}
            selectedProjectId={activeProject.id}
            onSelectProject={setSelectedProjectId}
            onNewProject={handleNewProject}
            onEditProject={handleEditProject}
            results={results}
            tasks={state.tasks}
          />

          {/* FOCUSED PROJECT HIERARCHY (Proyecto ➔ Resultados ➔ Objetivos ➔ Tareas) */}
          <ProjectHierarchyView
            project={activeProject}
            results={projectResults}
            onNewResult={handleNewResult}
            onNewObjective={handleNewObjective}
            onNewTask={handleNewTask}
            onEditProject={handleEditProject}
            onOpenTactical={(taskId) => setSelectedTacticalTaskId(taskId)}
          />
        </div>
      )}

      {viewMode === 'tree' && (
        <GlobalHierarchyTree
          projects={projects}
          results={results}
          onNewResult={handleNewResult}
          onNewObjective={handleNewObjective}
          onNewTask={handleNewTask}
          onNewProject={handleNewProject}
          onEditProject={handleEditProject}
          onOpenTactical={(taskId) => setSelectedTacticalTaskId(taskId)}
        />
      )}

      {viewMode === 'tasks' && <TasksTab />}

      {/* ARCHIVED RESULTS SECTION */}
      {archived.length > 0 && viewMode !== 'tasks' && (
        <div className="mt-6 border-t border-line/60 pt-4">
          <Button
            variant="ghost"
            className="text-[12px] text-ink-3 px-2"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived
              ? t('planning.results.hideArchived')
              : `${t('planning.results.showArchived')} (${archived.length})`}
          </Button>

          {showArchived && (
            <ul className="mt-2 flex flex-col gap-2">
              {archived.map((result) => (
                <li
                  key={result.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface/50 px-3.5 py-2"
                >
                  <Link
                    to={`/planning/results/${result.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-[14px] text-ink">{result.name}</p>
                    <p className="text-[11px] text-text-3">
                      {result.projectName || 'Proyecto Principal'} · {t('resultStatus.archived')}
                    </p>
                  </Link>
                  <Button
                    variant="secondary"
                    className="text-[12px] px-2.5 py-1"
                    onClick={() => restoreResult(result.id)}
                  >
                    {t('planning.results.restore')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* MODALS & SHEETS */}
      <ProjectFormSheet
        open={projectFormOpen}
        project={editingProject}
        onSaved={(saved) => {
          setSelectedProjectId(saved.id)
        }}
        onDeleted={(deletedId) => {
          const remaining = projects.filter((p) => p.id !== deletedId)
          if (remaining.length > 0) {
            setSelectedProjectId(remaining[0].id)
          }
        }}
        onClose={() => {
          setProjectFormOpen(false)
          setEditingProject(undefined)
        }}
      />

      <ResultFormSheet
        open={resultFormOpen}
        initialName={resultSeedName}
        initialProjectName={resultSeedProject}
        onClose={() => {
          setResultFormOpen(false)
          setResultSeedName(undefined)
          setResultSeedProject(undefined)
        }}
      />

      {targetResultForObj && (
        <ObjectiveFormSheet
          open={objectiveFormOpen}
          resultId={targetResultForObj.id}
          onClose={() => {
            setObjectiveFormOpen(false)
            setTargetResultForObj(undefined)
          }}
        />
      )}

      <TaskFormSheet
        open={taskFormOpen}
        preset={taskPreset}
        collapsedMore
        onClose={() => {
          setTaskFormOpen(false)
          setTaskPreset({})
        }}
      />

      {/* CONFIRM DIALOGS */}
      <ConfirmDialog
        open={capOpen}
        title={t('planning.results.createTitle')}
        message={t('planning.results.softCap', { count: attendingCount })}
        confirmLabel={t('planning.results.writeJournal')}
        cancelLabel={t('planning.results.createAnyway')}
        onConfirm={writeJournal}
        onCancel={() => {
          setCapOpen(false)
          setResultFormOpen(true)
        }}
        onDismiss={() => setCapOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(archiveId)}
        title={t('common.archive')}
        tone="danger"
        message={t('planning.results.archiveConfirm')}
        onCancel={() => setArchiveId(null)}
        onConfirm={() => {
          if (archiveId) archiveResult(archiveId)
          setArchiveId(null)
        }}
      />
      {/* TACTICAL TASK MODAL FOR HIERARCHY VIEWS */}
      {selectedTacticalTaskId && (
        <TacticalTaskModal
          taskId={selectedTacticalTaskId}
          onClose={() => setSelectedTacticalTaskId(null)}
        />
      )}
    </Page>
  )
}

function TasksTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()
  const { toggle, execute, dialog } = useTaskCompletion()
  const actions = useTaskActions()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>()
  const [assigning, setAssigning] = useState<Task | undefined>()
  const [selectedTacticalTaskId, setSelectedTacticalTaskId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [grouping, setGrouping] = useState<'tree' | 'importance'>('tree')
  const [resultId, setResultId] = useState('')
  const [objectiveId, setObjectiveId] = useState('')
  const [stage, setStage] = useState<StageId | ''>('')
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [skillId, setSkillId] = useState('')
  const [before, setBefore] = useState('')

  const projects = allProjects(state)
  const objectives = resultId ? pickerObjectives(state, resultId) : []
  const filterCount = [resultId, objectiveId, stage, status, skillId, before].filter(Boolean).length

  const filtered = useMemo(() => {
    return state.tasks
      .filter((task) => {
        if (taskResultStatus(state, task) === 'archived') return false
        if (resultId && task.resultId !== resultId) return false
        if (objectiveId && task.objectiveId !== objectiveId) return false
        if (stage && task.stage !== stage) return false
        if (status && task.status !== status) return false
        if (skillId && task.skillId !== skillId) return false
        if (before && (!task.dueAt || task.dueAt.slice(0, 10) > before)) return false
        return true
      })
      .sort((a, b) => {
        return a.importance - b.importance
      })
  }, [state, resultId, objectiveId, stage, status, skillId, before])

  // Group tasks by project hierarchy
  const projectTreeGroups = useMemo(() => {
    const projectMap = new Map<string, Task[]>()
    const looseTasks: Task[] = []

    for (const task of filtered) {
      const proj = projectOfTask(state, task)
      if (proj) {
        const list = projectMap.get(proj.id) ?? []
        list.push(task)
        projectMap.set(proj.id, list)
      } else {
        looseTasks.push(task)
      }
    }

    const groups: { project: Project; tasks: Task[] }[] = []
    for (const proj of projects) {
      const pTasks = projectMap.get(proj.id)
      if (pTasks && pTasks.length > 0) {
        groups.push({ project: proj, tasks: pTasks })
      }
    }

    return { groups, looseTasks }
  }, [filtered, state, projects])

  // Group tasks by importance level
  const importanceGroups = useMemo(() => {
    const vital = filtered.filter((t) => t.importance === 1)
    const alta = filtered.filter((t) => t.importance === 2)
    const media = filtered.filter((t) => t.importance >= 3 || !t.importance)
    return [
      { key: 'vital', title: 'Prioridad Vital (Nivel 1)', tasks: vital, tone: '#dc2626' },
      { key: 'alta', title: 'Prioridad Alta (Nivel 2)', tasks: alta, tone: '#c47a00' },
      { key: 'media', title: 'Prioridad Normal (Nivel 3)', tasks: media, tone: '#7a3fe0' },
    ].filter((g) => g.tasks.length > 0)
  }, [filtered])

  const clear = () => {
    setResultId('')
    setObjectiveId('')
    setStage('')
    setStatus('')
    setSkillId('')
    setBefore('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* GLOBAL MULTI-SABER PROGRESS BANNER */}
      {state.tasks.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div>
              <h3 className="text-[14px] font-bold text-ink">
                Saberes Conquistados en la Lista
              </h3>
              <p className="text-[12px] text-ink-3">
                Cada tarea aporta su saber propio (Literatura, Arte, Empresa, Suelto) impregnada del color del proyecto.
              </p>
            </div>
          </div>
          <SaberProgressBar tasks={filtered} showBadges={true} size="md" />
        </div>
      )}

      {/* CONTROLS ROW */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreating(true)}>
            + {t('planning.tasks.new')}
          </Button>

          <Button variant="secondary" onClick={() => setFiltersOpen(true)}>
            {t('planning.openFilters')}
            {filterCount > 0 ? ` · ${filterCount}` : ''}
          </Button>
        </div>

        {/* GROUPING SWITCHER */}
        <div className="flex items-center gap-1 rounded-xl bg-subtle p-1 border border-line/60">
          <button
            type="button"
            onClick={() => setGrouping('tree')}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-lg transition-all ${
              grouping === 'tree'
                ? 'bg-white text-ink shadow-xs font-semibold'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            Por Árbol de Proyecto
          </button>
          <button
            type="button"
            onClick={() => setGrouping('importance')}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-lg transition-all ${
              grouping === 'importance'
                ? 'bg-white text-ink shadow-xs font-semibold'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            Por Nivel de Importancia
          </button>
        </div>
      </div>

      {state.tasks.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={() => navigate('/')}>{t('planning.tasks.emptyCta')}</Button>
          }
        >
          {t('planning.tasks.empty')}
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          action={
            <Button onClick={clear}>{t('planning.tasks.clearFilters')}</Button>
          }
        >
          {t('planning.tasks.emptyFiltered')}
        </EmptyState>
      ) : grouping === 'tree' ? (
        /* HIERARCHICAL TREE VIEW OF ALL TASKS */
        <div className="flex flex-col gap-4">
          {projectTreeGroups.groups.map(({ project, tasks }) => (
            <div
              key={project.id}
              className="rounded-2xl border border-line bg-white p-4 shadow-xs"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: project.color,
              }}
            >
              {/* Project Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-line/60">
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <h3 className="text-[15px] font-bold text-ink">{project.name}</h3>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${project.color}15`,
                      color: project.color,
                    }}
                  >
                    {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
                  </span>
                </div>
                <div className="min-w-[200px] flex-1 max-w-xs">
                  <SaberProgressBar
                    tasks={tasks}
                    projectColor={project.color}
                    showBadges={false}
                    size="sm"
                  />
                </div>
              </div>

              {/* Tasks list under this project */}
              <ul className="flex flex-col gap-2">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <TaskRow
                      task={task}
                      onToggle={() => toggle(task)}
                      onExecute={() => execute(task)}
                      onOpen={() => setEditing(task)}
                      onOpenTactical={() => setSelectedTacticalTaskId(task.id)}
                      onAssign={() => setAssigning(task)}
                      onDelete={() => actions.requestDelete(task)}
                      showContext={true}
                      showProjection
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* LOOSE TASKS SECTION */}
          {projectTreeGroups.looseTasks.length > 0 && (
            <div
              className="rounded-2xl border border-line bg-white p-4 shadow-xs"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: '#c47a00',
              }}
            >
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-line/60">
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: '#c47a00' }}
                  />
                  <h3 className="text-[15px] font-bold text-ink">Tareas Sueltas</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-[#c47a00]">
                    {projectTreeGroups.looseTasks.length} tareas
                  </span>
                </div>
                <div className="min-w-[200px] flex-1 max-w-xs">
                  <SaberProgressBar
                    tasks={projectTreeGroups.looseTasks}
                    projectColor="#c47a00"
                    showBadges={false}
                    size="sm"
                  />
                </div>
              </div>

              <ul className="flex flex-col gap-2">
                {projectTreeGroups.looseTasks.map((task) => (
                  <li key={task.id}>
                    <TaskRow
                      task={task}
                      onToggle={() => toggle(task)}
                      onExecute={() => execute(task)}
                      onOpen={() => setEditing(task)}
                      onOpenTactical={() => setSelectedTacticalTaskId(task.id)}
                      onAssign={() => setAssigning(task)}
                      onDelete={() => actions.requestDelete(task)}
                      showContext={true}
                      showProjection
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        /* IMPORTANCE LEVEL VIEW */
        <div className="flex flex-col gap-4">
          {importanceGroups.map((group) => (
            <div
              key={group.key}
              className="rounded-2xl border border-line bg-white p-4 shadow-xs"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: group.tone,
              }}
            >
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-line/60">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.tone }}
                  />
                  <h3 className="text-[14px] font-bold text-ink">{group.title}</h3>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${group.tone}15`,
                      color: group.tone,
                    }}
                  >
                    {group.tasks.length}
                  </span>
                </div>
                <div className="min-w-[160px] max-w-xs flex-1">
                  <SaberProgressBar
                    tasks={group.tasks}
                    projectColor={group.tone}
                    showBadges={false}
                    size="sm"
                  />
                </div>
              </div>

              <ul className="flex flex-col gap-2">
                {group.tasks.map((task) => (
                  <li key={task.id}>
                    <TaskRow
                      task={task}
                      onToggle={() => toggle(task)}
                      onExecute={() => execute(task)}
                      onOpen={() => setEditing(task)}
                      onOpenTactical={() => setSelectedTacticalTaskId(task.id)}
                      onAssign={() => setAssigning(task)}
                      onDelete={() => actions.requestDelete(task)}
                      showContext={true}
                      showProjection
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {dialog}
      {actions.dialog}
      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('planning.tasks.filters')}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={clear}>
              {t('planning.tasks.clearFilters')}
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <Select
            value={resultId}
            onChange={(e) => {
              setResultId(e.target.value)
              setObjectiveId('')
            }}
          >
            <option value="">{t('planning.tasks.filterResult')}</option>
            {pickerResults(state).map((result) => (
              <option key={result.id} value={result.id}>
                {result.name}
              </option>
            ))}
          </Select>
          <Select value={objectiveId} onChange={(e) => setObjectiveId(e.target.value)}>
            <option value="">{t('planning.tasks.filterObjective')}</option>
            {objectives.map((objective) => (
              <option key={objective.id} value={objective.id}>
                {objective.name}
              </option>
            ))}
          </Select>
          <Select value={stage} onChange={(e) => setStage(e.target.value as StageId | '')}>
            <option value="">{t('planning.tasks.filterStage')}</option>
            {STAGE_ORDER.map((id) => (
              <option key={id} value={id}>
                {t(`stages.${id}.short`)}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | '')}>
            <option value="">{t('planning.tasks.filterStatus')}</option>
            {(
              [
                'pending',
                'in_progress',
                'done_on_time',
                'done_late',
                'cancelled',
              ] as TaskStatus[]
            ).map((id) => (
              <option key={id} value={id}>
                {t(`taskStatus.${id}`)}
              </option>
            ))}
          </Select>
          <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
            <option value="">{t('planning.tasks.filterSkill')}</option>
            {state.skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skillName(t, skill)}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            aria-label={t('planning.tasks.filterDate')}
          />
        </div>
      </Sheet>
      <TaskFormSheet open={creating} collapsedMore onClose={() => setCreating(false)} />
      <TaskFormSheet
        open={Boolean(editing)}
        task={editing}
        moments={{
          onComplete: (tk) => toggle(tk),
          onExecute: (tk) => execute(tk),
          onReturn: (tk) => actions.back(tk),
        }}
        onClose={() => setEditing(undefined)}
      />
      <AssignSheet
        open={Boolean(assigning)}
        task={assigning}
        onClose={() => setAssigning(undefined)}
      />
      {selectedTacticalTaskId && (
        <TacticalTaskModal
          taskId={selectedTacticalTaskId}
          onClose={() => setSelectedTacticalTaskId(null)}
        />
      )}
    </div>
  )
}
