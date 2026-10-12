import { useMemo, useState } from 'react'
import {
  Rocket,
  Lightbulb,
  AlertTriangle,
  Compass,
  BarChart3,
  Send,
  Check,
  Copy,
  Trash2,
  Calendar,
  FolderGit2,
  Target,
  Sparkles,
} from 'lucide-react'
import { useFeedback } from '@/app/FeedbackProvider'
import { addComment, deleteComment } from '@/data/actions'
import { journalFor } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatDateTime } from '@/i18n/format'
import { cx } from '@/components/ui/primitives'

const NOTE_ARCHETYPES = [
  { id: 'hito', label: 'Hito', icon: Rocket, color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300' },
  { id: 'bloqueo', label: 'Bloqueo', icon: AlertTriangle, color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300' },
  { id: 'rumbo', label: 'Rumbo', icon: Compass, color: 'text-violet bg-violet-soft border-violet/30' },
  { id: 'feedback', label: 'Feedback', icon: BarChart3, color: 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300' },
] as const

export function ProjectJournalView() {
  const state = useAleph()
  const feedback = useFeedback()
  const localeTag = state.character.locale?.startsWith('en') ? 'en-US' : 'es-AR'

  const projects = state.projects || [
    {
      id: 'proj_obra_principal',
      name: 'La Obra Principal',
      description: 'Proyecto central de creación, arte y desarrollo económico.',
      color: '#7a3fe0',
      icon: 'sparkles',
    },
  ]

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'proj_obra_principal')
  const [selectedArchetype, setSelectedArchetype] = useState<string>('hito')
  const [targetId, setTargetId] = useState<string>('') // Can link to a specific result/objective
  const [text, setText] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0]

  // Results & Objectives under this project
  const projectResults = useMemo(() => {
    if (!activeProject) return []
    return state.results.filter(
      (r) =>
        r.projectName === activeProject.name ||
        `proj_${r.projectName?.toLowerCase().replace(/\s+/g, '_')}` === activeProject.id ||
        (activeProject.id === 'proj_obra_principal' && r.projectName === 'La Obra Principal'),
    )
  }, [activeProject, state.results])

  const projectObjectives = useMemo(() => {
    const resIds = new Set(projectResults.map((r) => r.id))
    return state.objectives.filter((o) => resIds.has(o.resultId))
  }, [projectResults, state.objectives])

  // Get project journal entries (rollup of project, results, objectives, tasks)
  const allEntries = useMemo(() => {
    if (selectedProjectId === 'all') {
      const combined: ReturnType<typeof journalFor> = []
      projects.forEach((p) => {
        combined.push(...journalFor(state, 'project', p.id))
      })
      // deduplicate by comment.id
      const seen = new Set<string>()
      return combined.filter((e) => {
        if (seen.has(e.comment.id)) return false
        seen.add(e.comment.id)
        return true
      }).sort((a, b) => b.comment.createdAt.localeCompare(a.comment.createdAt))
    }
    return journalFor(state, 'project', activeProject?.id || 'proj_obra_principal')
  }, [activeProject?.id, projects, selectedProjectId, state])

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (filterType === 'all') return allEntries
    return allEntries.filter((e) => {
      const match = e.comment.body.match(/^\[([^\]]+)\]/)
      if (!match) return false
      const typeLabel = match[1].toLowerCase()
      return typeLabel.includes(filterType.toLowerCase())
    })
  }, [allEntries, filterType])

  const handleSave = () => {
    const trimmed = text.trim()
    if (!trimmed) return

    const archetype = NOTE_ARCHETYPES.find((a) => a.id === selectedArchetype)
    const prefix = archetype ? `[${archetype.label}]` : '[Nota de Proyecto]'

    let parentType: 'project' | 'result' | 'objective' = 'project'
    let parentId = activeProject.id

    if (targetId.startsWith('res_')) {
      parentType = 'result'
      parentId = targetId.replace('res_', '')
    } else if (targetId.startsWith('obj_')) {
      parentType = 'objective'
      parentId = targetId.replace('obj_', '')
    }

    const fullBody = `${prefix}\n${trimmed}`
    addComment(parentType, parentId, fullBody)

    feedback?.notify(`Apunte registrado en ${activeProject.name}`)
    setSavedSuccess(true)
    setTimeout(() => {
      setText('')
      setSavedSuccess(false)
    }, 1500)
  }

  const handleCopy = async (id: string, body: string) => {
    try {
      await navigator.clipboard.writeText(body)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // ignore
    }
  }

  const handleDelete = (id: string) => {
    deleteComment(id)
    feedback?.notify('Apunte eliminado')
  }

  const archetypePlaceholder = useMemo(() => {
    switch (selectedArchetype) {
      case 'hito':
        return '¿Qué hito, avance o entrega completaste hoy en este proyecto? ¿Qué significa para tu resultado?'
      case 'idea':
        return '¿Qué nueva idea, estrategia o propuesta querés validar en este proyecto?'
      case 'bloqueo':
        return '¿Qué cuello de botella u obstáculo encontraste y qué hipótesis tenés para destrabarlo?'
      case 'rumbo':
        return '¿Qué decisión de enfoque, alcance o prioridades tomaste para este proyecto?'
      case 'feedback':
        return '¿Qué respuesta de usuario, métrica o validación empírica obtuviste?'
      default:
        return 'Escribí aquí una nota de bitácora sobre la evolución de este proyecto...'
    }
  }, [selectedArchetype])

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-5 space-y-5">
      {/* Project Switcher Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11.5px] font-semibold text-ink-3">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10.5px]">
            <FolderGit2 className="size-3.5 text-violet" />
            <span>Seleccionar Proyecto</span>
          </span>
          <span className="text-[10px] text-ink-4">{projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}</span>
        </div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {projects.map((proj) => {
            const isSelected = selectedProjectId === proj.id
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => {
                  setSelectedProjectId(proj.id)
                  setTargetId('')
                }}
                className={cx(
                  'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold transition-all shrink-0 active:scale-95 shadow-2xs',
                  isSelected
                    ? 'border-violet bg-violet-soft text-violet shadow-xs'
                    : 'border-line bg-surface text-ink-2 hover:border-violet/40 hover:bg-subtle',
                )}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: proj.color || '#7a3fe0' }}
                />
                <span>{proj.name}</span>
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => {
              setSelectedProjectId('all')
              setTargetId('')
            }}
            className={cx(
              'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-all shrink-0 active:scale-95 shadow-2xs',
              selectedProjectId === 'all'
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-surface text-ink-3 hover:text-ink',
            )}
          >
            <span>Ver Todos</span>
          </button>
        </div>
      </div>

      {/* Project Context & Snapshot Card */}
      {selectedProjectId !== 'all' && activeProject && (
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-gradient-to-r from-subtle/70 via-surface to-subtle/40 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: activeProject.color || '#7a3fe0' }}
                />
                <h3 className="font-display text-[16px] font-bold text-ink">
                  {activeProject.name}
                </h3>
              </div>
              {activeProject.description && (
                <p className="mt-1 text-[12px] text-ink-3 leading-snug">
                  {activeProject.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-3">
              <Sparkles className="size-3 text-violet" />
              <span>{allEntries.length} notas</span>
            </div>
          </div>

          {/* Active Results / Objectives preview */}
          {(projectResults.length > 0 || projectObjectives.length > 0) && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-line/60 text-[11px]">
              {projectResults.map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1 rounded-full bg-surface border border-line px-2.5 py-0.5 font-medium text-ink-2"
                  title="Resultado vinculado"
                >
                  <Target className="size-3 text-violet" />
                  <span className="truncate max-w-[170px]">{r.name}</span>
                </span>
              ))}

              {projectObjectives.slice(0, 2).map((o) => (
                <span
                  key={o.id}
                  className="inline-flex items-center gap-1 rounded-full bg-surface border border-line px-2 py-0.5 font-medium text-ink-3"
                  title="Objetivo vinculado"
                >
                  <span className="size-1.5 rounded-full bg-violet" />
                  <span className="truncate max-w-[150px]">{o.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor de la Bitácora de Proyecto */}
      {selectedProjectId !== 'all' && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3.5 sm:p-4 shadow-xs">
          {/* Selector de Arquetipo Táctico */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink-3 mr-1">Tipo de apunte:</span>
            {NOTE_ARCHETYPES.map((arch) => {
              const Icon = arch.icon
              const isSelected = selectedArchetype === arch.id
              return (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => setSelectedArchetype(arch.id)}
                  className={cx(
                    'flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all active:scale-95',
                    isSelected
                      ? arch.color + ' shadow-2xs scale-[1.02]'
                      : 'border-line bg-subtle/50 text-ink-3 hover:text-ink hover:bg-subtle',
                  )}
                >
                  <Icon className="size-3" />
                  <span>{arch.label}</span>
                </button>
              )
            })}
          </div>

          {/* Vínculo opcional a Resultado u Objetivo */}
          {(projectResults.length > 0 || projectObjectives.length > 0) && (
            <div className="flex items-center gap-2 text-[11.5px]">
              <span className="font-semibold text-ink-3 shrink-0">Vincular a:</span>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="h-7 rounded-lg border border-line bg-subtle/50 px-2 text-[11.5px] font-medium text-ink focus:border-violet focus:outline-hidden"
              >
                <option value="">{activeProject.name} (General)</option>
                {projectResults.map((r) => (
                  <option key={r.id} value={`res_${r.id}`}>
                    🎯 Resultado: {r.name}
                  </option>
                ))}
                {projectObjectives.map((o) => (
                  <option key={o.id} value={`obj_${o.id}`}>
                    ⚡ Objetivo: {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleSave()
              }
            }}
            placeholder={archetypePlaceholder}
            className="w-full rounded-xl border border-line bg-subtle/40 p-3 text-[13px] leading-relaxed text-ink placeholder:text-ink-4 focus:border-violet focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet/20 transition-all resize-none"
          />

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[10.5px] text-ink-4 hidden sm:inline">
              Presiona <kbd className="font-sans px-1 py-0.5 rounded border border-line bg-subtle text-[10px] text-ink-3">Ctrl/Cmd + Enter</kbd> para registrar
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {text.trim() && (
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="text-[11px] font-semibold text-ink-3 hover:text-ink transition-colors px-2 py-1"
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!text.trim() || savedSuccess}
                className="flex items-center gap-1.5 rounded-xl bg-violet px-4 py-2 text-[12px] font-bold text-white hover:bg-violet-600 active:scale-95 disabled:opacity-40 transition-all shadow-xs"
              >
                {savedSuccess ? (
                  <>
                    <Check className="size-3.5 stroke-[2.5]" />
                    <span>¡Registrado!</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Registrar en Proyecto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de la Bitácora del Proyecto */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
            Línea de evolución del proyecto ({filteredEntries.length})
          </h4>

          {/* Filtros rápidos por arquetipo */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cx(
                'rounded-lg px-2 py-0.5 font-semibold transition',
                filterType === 'all' ? 'bg-ink text-white' : 'text-ink-3 hover:text-ink',
              )}
            >
              Todos
            </button>
            {NOTE_ARCHETYPES.map((arch) => (
              <button
                key={arch.id}
                type="button"
                onClick={() => setFilterType(arch.id)}
                className={cx(
                  'rounded-lg px-2 py-0.5 font-semibold transition',
                  filterType === arch.id ? 'bg-violet text-white' : 'text-ink-3 hover:text-ink',
                )}
              >
                {arch.label}
              </button>
            ))}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-3">
            <p className="text-[14px] font-medium">No hay apuntes registrados en esta vista.</p>
            <p className="mt-1 text-[12px] text-ink-4">
              Usá los botones de Hito, Idea o Bloqueo para documentar el camino de tu proyecto.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredEntries.map(({ comment, originType, originTitle }, idx) => {
              const match = comment.body.match(/^\[([^\]]+)\]\n/)
              const archetypeTag = match ? match[1] : null
              const cleanContent = match
                ? comment.body.replace(/^\[[^\]]+\]\n/, '')
                : comment.body

              const archetypeMeta = NOTE_ARCHETYPES.find(
                (a) => a.label.toLowerCase() === archetypeTag?.toLowerCase(),
              )

              return (
                <article
                  key={comment.id || `proj-entry-${idx}`}
                  className="group relative flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3.5 sm:p-4 shadow-2xs hover:border-violet/40 transition-colors"
                >
                  <header className="flex items-center justify-between text-[11px] text-ink-3 flex-wrap gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-ink-3">
                        <Calendar className="size-3 text-violet" />
                        <span>{formatDateTime(comment.createdAt, localeTag)}</span>
                      </span>

                      {archetypeTag && (
                        <span
                          className={cx(
                            'rounded-full border px-2 py-0.2 text-[10.5px] font-bold',
                            archetypeMeta?.color || 'bg-subtle border-line text-ink-2',
                          )}
                        >
                          {archetypeTag}
                        </span>
                      )}

                      {originTitle && originType !== 'project' && (
                        <span className="rounded-full bg-surface border border-line px-2 py-0.2 text-[10px] font-medium text-ink-3">
                          {originType === 'result' ? '🎯' : originType === 'objective' ? '⚡' : '📌'} {originTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-auto">
                      <button
                        type="button"
                        onClick={() => handleCopy(comment.id, comment.body)}
                        className="rounded-lg p-1 text-ink-3 hover:text-ink hover:bg-subtle transition-colors"
                        title="Copiar texto"
                      >
                        {copiedId === comment.id ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="rounded-lg p-1 text-ink-3 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Eliminar apunte"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </header>

                  <p className="text-[13px] leading-relaxed text-ink whitespace-pre-wrap font-normal">
                    {cleanContent}
                  </p>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
