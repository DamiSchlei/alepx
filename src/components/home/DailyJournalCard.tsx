import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  Check,
  Send,
  Sparkles,
  Target,
  ExternalLink,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { CharacterAssistantSheet } from '@/components/character/CharacterAssistantSheet'
import { useFeedback } from '@/app/FeedbackProvider'
import { addComment } from '@/data/actions'
import { journalFor, tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { formatDateTime } from '@/i18n/format'

interface DailyJournalCardProps {
  activeDay: string
  localeTag: string
}

export function DailyJournalCard({ activeDay, localeTag }: DailyJournalCardProps) {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const state = useAleph()
  const character = state.character

  const [reflectionText, setReflectionText] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [openBitacoraSheet, setOpenBitacoraSheet] = useState(false)

  // Day's tasks and connections
  const dayTasks = useMemo(() => tasksForDay(state, activeDay), [state, activeDay])
  const doneTasks = useMemo(() => dayTasks.filter((t) => isTaskDone(t.status)), [dayTasks])
  const pendingTasks = useMemo(() => dayTasks.filter((t) => !isTaskDone(t.status)), [dayTasks])

  // Linked objectives and results from today's tasks
  const { linkedObjectives, linkedResults } = useMemo(() => {
    const objMap = new Map<string, string>()
    const resMap = new Map<string, string>()

    // Priority: objectives and results from completed tasks, then pending tasks
    const relevantTasks = doneTasks.length > 0 ? doneTasks : dayTasks

    relevantTasks.forEach((task) => {
      if (task.objectiveId) {
        const obj = state.objectives.find((o) => o.id === task.objectiveId)
        if (obj) {
          objMap.set(obj.id, obj.name)
          if (obj.resultId) {
            const res = state.results.find((r) => r.id === obj.resultId)
            if (res) resMap.set(res.id, res.name)
          }
        }
      }
      if (task.resultId) {
        const res = state.results.find((r) => r.id === task.resultId)
        if (res) resMap.set(res.id, res.name)
      }
    })

    // If day has no tasks, show active objectives and results
    if (objMap.size === 0) {
      state.objectives
        .filter((o) => o.status === 'in_progress' || o.status === 'pending')
        .slice(0, 2)
        .forEach((o) => objMap.set(o.id, o.name))
    }
    if (resMap.size === 0) {
      state.results
        .filter((r) => r.status === 'active')
        .slice(0, 2)
        .forEach((r) => resMap.set(r.id, r.name))
    }

    return {
      linkedObjectives: Array.from(objMap.values()),
      linkedResults: Array.from(resMap.values()),
    }
  }, [dayTasks, doneTasks, state.objectives, state.results])

  // Contextual invitation prompt
  const contextualPrompt = useMemo(() => {
    const objNames = linkedObjectives.slice(0, 2).map((n) => `«${n}»`).join(' y ')
    const resNames = linkedResults.slice(0, 2).map((n) => `«${n}»`).join(' y ')

    if (doneTasks.length > 0) {
      const taskCountStr = `${doneTasks.length} ${doneTasks.length === 1 ? 'tarea realizada' : 'tareas realizadas'}`
      if (resNames && objNames) {
        return `Hoy registrás ${taskCountStr} impulsando el objetivo ${objNames} y tu resultado ${resNames}. ¿Cómo impactaron estas acciones en lo que te propusiste? ¿Qué descubriste sobre tu ritmo y dirección?`
      }
      if (resNames) {
        return `Hoy lograste ${taskCountStr} con foco en ${resNames}. ¿Qué avances concretos sentís que lograste hacia ese resultado y qué aprendizajes te deja la jornada?`
      }
      if (objNames) {
        return `Con ${taskCountStr} orientadas a ${objNames}: ¿cómo sentís que respondió tu enfoque? Anotá tus reflexiones, dudas y próximas decisiones.`
      }
      return `Con ${taskCountStr} hoy: ¿cómo dialogan estos pasos con tus objetivos y el resultado deseado de tu obra?`
    }

    if (pendingTasks.length > 0) {
      if (objNames) {
        return `Tenés ${pendingTasks.length} ${pendingTasks.length === 1 ? 'tarea propuesta' : 'tareas propuestas'} hacia ${objNames}. ¿Qué claridad o intención querés fijar antes de ejecutarlas?`
      }
      return `Para las tareas de hoy: ¿cuál es la decisión central que querés sostener hacia tus objetivos propuestos?`
    }

    if (resNames) {
      return `Tus resultados propuestos activos son ${resNames}. Registrá en tu bitácora qué ideas, decisiones o reflexiones tenés hoy para avanzar hacia ellos.`
    }

    return 'Espacio de bitácora personal: conectá tus decisiones, acciones cotidianas y aprendizajes con los resultados y objetivos que te propusiste alcanzar.'
  }, [doneTasks.length, linkedObjectives, linkedResults, pendingTasks.length])

  // Journal entries
  const journalEntries = journalFor(state, 'character', character.id || '')
  const recentReflections = journalEntries.slice(-3).reverse()

  const handleSaveReflection = () => {
    const trimmed = reflectionText.trim()
    if (!trimmed || !character.id) return

    // Formatted header with day context if applicable
    let header = `📝 Bitácora · Jornada ${activeDay}`
    if (linkedResults.length > 0) {
      header += `\n🎯 Resultados: ${linkedResults.join(', ')}`
    }
    if (linkedObjectives.length > 0) {
      header += `\n⚡ Objetivos: ${linkedObjectives.join(', ')}`
    }

    const fullContent = `${header}\n\n${trimmed}`
    addComment('character', character.id, fullContent)

    feedback?.notify(t('reflection.journalSuccess', '¡Guardada en tu Bitácora!'))
    setSavedSuccess(true)
    setTimeout(() => {
      setReflectionText('')
      setSavedSuccess(false)
    }, 1800)
  }

  return (
    <>
      <section
        aria-label="Bitácora del Personaje"
        className="w-full overflow-hidden rounded-[24px] border border-violet/30 bg-surface p-4 shadow-[var(--shadow-paper)] transition-all sm:p-5"
      >
        {/* Header: Title + Bitácora Counter + Full Bitácora trigger */}
        <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-7 items-center justify-center rounded-lg bg-violet text-white shrink-0 shadow-xs">
              <BookOpen className="size-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[14px] font-bold tracking-tight text-ink flex items-center gap-2 truncate">
                <span>Bitácora del Personaje</span>
                <span className="rounded-full bg-violet-soft px-2 py-0.5 text-[10px] font-semibold text-violet border border-violet/20 hidden sm:inline">
                  {character.name || 'Aleph'}
                </span>
              </h4>
              <p className="text-[11px] text-ink-3 truncate">
                Reflexión sobre objetivos y resultados por las tareas de hoy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpenBitacoraSheet(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet/25 bg-violet-soft/40 px-2.5 py-1 text-[11.5px] font-semibold text-violet hover:bg-violet-soft transition-all active:scale-95 shrink-0"
            title="Abrir visor completo de la Bitácora"
          >
            <span>Ver Bitácora</span>
            <span className="rounded-full bg-violet px-1.5 py-0.2 text-[10px] font-bold text-white">
              {journalEntries.length}
            </span>
            <ExternalLink className="size-3 opacity-60" />
          </button>
        </div>

        {/* Dynamic Contextual Invitation Box: Results & Objectives by Completed Tasks */}
        <div className="mt-3.5 flex flex-col gap-2 rounded-2xl border border-violet/20 bg-gradient-to-br from-violet-soft/40 via-surface to-violet-soft/20 p-3 sm:p-3.5">
          <div className="flex items-start gap-2.5">
            <Sparkles className="size-4 text-violet shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium leading-relaxed text-ink-2">
                {contextualPrompt}
              </p>
            </div>
          </div>

          {/* Quick Context Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            {doneTasks.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-3" />
                <span>{doneTasks.length} de {dayTasks.length} tareas completadas</span>
              </span>
            )}

            {linkedResults.slice(0, 2).map((resName) => (
              <span
                key={resName}
                className="inline-flex items-center gap-1 rounded-full bg-surface border border-line px-2.5 py-0.5 font-medium text-ink-2 truncate max-w-[200px]"
                title={`Resultado: ${resName}`}
              >
                <Target className="size-3 text-violet shrink-0" />
                <span className="truncate">{resName}</span>
              </span>
            ))}

            {linkedObjectives.slice(0, 2).map((objName) => (
              <span
                key={objName}
                className="inline-flex items-center gap-1 rounded-full bg-surface border border-line px-2.5 py-0.5 font-medium text-ink-3 truncate max-w-[200px]"
                title={`Objetivo: ${objName}`}
              >
                <span className="size-1.5 rounded-full bg-violet shrink-0" />
                <span className="truncate">{objName}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Reflection Input Area */}
        <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 sm:p-3.5 shadow-2xs">
          <textarea
            id="bitacora-reflection-field"
            rows={3}
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleSaveReflection()
              }
            }}
            placeholder="Escribí aquí tu reflexión sobre los resultados y objetivos propuestos, tus avances o dudas de hoy..."
            className="w-full rounded-xl border border-line bg-subtle/50 p-2.5 sm:p-3 text-[13px] leading-relaxed text-ink placeholder:text-ink-4 focus:border-violet focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet/20 transition-all resize-none"
          />

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[10.5px] text-ink-4 hidden sm:inline">
              Presiona <kbd className="font-sans px-1 py-0.5 rounded border border-line bg-subtle text-[10px] text-ink-3">Ctrl/Cmd + Enter</kbd> para registrar
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {reflectionText.trim() ? (
                <button
                  type="button"
                  onClick={() => setReflectionText('')}
                  className="text-[11px] font-semibold text-ink-3 hover:text-ink transition-colors px-2 py-1"
                >
                  Limpiar
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleSaveReflection}
                disabled={!reflectionText.trim() || savedSuccess}
                className="flex items-center gap-1.5 rounded-xl bg-violet px-3.5 py-1.5 text-[11.5px] font-bold text-white hover:bg-violet-600 active:scale-95 disabled:opacity-40 transition-all shadow-xs"
              >
                {savedSuccess ? (
                  <>
                    <Check className="size-3.5 stroke-[2.5]" />
                    <span>¡Guardada en bitácora!</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3" />
                    <span>Guardar en bitácora</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Últimas reflexiones guardadas en la Bitácora */}
          {recentReflections.length > 0 && (
            <div className="mt-1 pt-2 border-t border-line/60 flex flex-col gap-1.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3">
                Reflexiones recientes en tu Bitácora:
              </p>
              <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-0.5">
                {recentReflections.map((entry, idx) => (
                  <div
                    key={entry.comment?.id || `bitacora-entry-${entry.comment?.createdAt || idx}`}
                    className="rounded-lg bg-subtle/50 border border-line/70 px-2.5 py-1.5 text-[11.5px] text-ink-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-ink-4 mb-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-2.5 text-violet" />
                        <span>{formatDateTime(entry.comment.createdAt, localeTag)}</span>
                      </span>
                      <span className="text-violet font-semibold">Bitácora</span>
                    </div>
                    <p className="line-clamp-2 leading-snug whitespace-pre-wrap">
                      {entry.comment.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal visor completo de la Bitácora del Personaje */}
      <CharacterAssistantSheet
        open={openBitacoraSheet}
        onClose={() => setOpenBitacoraSheet(false)}
        initialTab="journal"
      />
    </>
  )
}
