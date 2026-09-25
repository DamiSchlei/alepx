import { useState } from 'react'
import {
  Sparkles,
  Send,
  Check,
  Copy,
  Trash2,
  Calendar,
  Flame,
  Target,
  Waves,
  Hourglass,
  BatteryCharging,
  Smile,
} from 'lucide-react'
import { useFeedback } from '@/app/FeedbackProvider'
import { addComment, deleteComment } from '@/data/actions'
import { journalFor } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatDateTime } from '@/i18n/format'
import { Avatar } from '@/components/character/Avatar'
import { cx } from '@/components/ui/primitives'

const DAILY_SPARKS = [
  { id: 'decision', icon: '💡', text: '¿Qué decisión valiosa tomé hoy?' },
  { id: 'resistencia', icon: '⚡', text: '¿Dónde sentí resistencia y cómo la atravesé?' },
  { id: 'ritmo', icon: '🎯', text: '¿Qué aprendí sobre mi ritmo, foco y energía?' },
  { id: 'gratitud', icon: '🌿', text: '¿Qué momento de satisfacción o gratitud rescato?' },
  { id: 'rumbo', icon: '🧭', text: '¿Hacia dónde quiero dirigir mi atención mañana?' },
] as const

const ENERGY_VIBES = [
  { id: 'imparable', label: 'Imparable', icon: Flame, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'enfocado', label: 'Enfocado', icon: Target, color: 'text-violet bg-violet-soft border-violet/30' },
  { id: 'en_flujo', label: 'En Flujo', icon: Waves, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { id: 'reflexivo', label: 'Reflexivo', icon: Hourglass, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'recargando', label: 'Recargando', icon: BatteryCharging, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
] as const

export function CharacterJournalView() {
  const state = useAleph()
  const character = state.character
  const feedback = useFeedback()
  const localeTag = character.locale?.startsWith('en') ? 'en-US' : 'es-AR'

  const [text, setText] = useState('')
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const entries = journalFor(state, 'character', character.id || '')

  const handleSelectSpark = (sparkText: string) => {
    setText((prev) => {
      const cleanPrev = prev.trim()
      if (!cleanPrev) return `${sparkText}\n\n`
      return `${cleanPrev}\n\n${sparkText}\n\n`
    })
  }

  const handleSave = () => {
    const trimmed = text.trim()
    if (!trimmed || !character.id) return

    let finalBody = trimmed
    if (selectedVibe) {
      const vibeObj = ENERGY_VIBES.find((v) => v.id === selectedVibe)
      if (vibeObj) {
        finalBody = `[Sintonía: ${vibeObj.label}]\n${trimmed}`
      }
    }

    addComment('character', character.id, finalBody)
    feedback?.notify('Reflexión registrada en la Bitácora del Personaje')
    setSavedSuccess(true)
    setTimeout(() => {
      setText('')
      setSelectedVibe(null)
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
    feedback?.notify('Reflexión eliminada de la bitácora')
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-5 space-y-5">
      {/* Header card with character status */}
      <div className="flex items-center justify-between rounded-2xl border border-violet/20 bg-gradient-to-r from-violet-soft/60 via-surface to-violet-soft/30 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl border border-violet/30 bg-surface shadow-xs">
            <Avatar avatar={character.avatar} size={48} className="rounded-2xl" />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-ink">
              {character.name || 'Aleph'} · Nivel {character.level}
            </h3>
            <p className="text-[12px] text-ink-3">
              {entries.length} {entries.length === 1 ? 'reflexión registrada' : 'reflexiones registradas'} en tu viaje personal
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-violet/25 bg-surface px-3 py-1 text-[11px] font-semibold text-violet">
          <Sparkles className="size-3.5 text-violet" />
          <span>Espacio íntimo</span>
        </div>
      </div>

      {/* Chispas del Día (Daily Sparks) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11.5px] font-semibold text-ink-3">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10.5px]">
            <Sparkles className="size-3 text-amber-500" />
            <span>Chispas de reflexión diaria</span>
          </span>
          <span className="text-[10px] text-ink-4">Tocá una para inspirarte</span>
        </div>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {DAILY_SPARKS.map((spark) => (
            <button
              key={spark.id}
              type="button"
              onClick={() => handleSelectSpark(spark.text)}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-2 hover:border-violet/40 hover:text-violet hover:bg-violet-soft/20 transition-all shrink-0 active:scale-95 shadow-2xs"
            >
              <span>{spark.icon}</span>
              <span>{spark.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor de la Bitácora */}
      <div className="flex flex-col gap-3 rounded-2xl border border-violet/25 bg-surface p-3.5 sm:p-4 shadow-xs">
        {/* Selector de Sintonía / Energía */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-ink-3 mr-1 flex items-center gap-1">
            <Smile className="size-3.5 text-violet" />
            <span>Sintonía:</span>
          </span>
          {ENERGY_VIBES.map((vibe) => {
            const Icon = vibe.icon
            const isSelected = selectedVibe === vibe.id
            return (
              <button
                key={vibe.id}
                type="button"
                onClick={() => setSelectedVibe((curr) => (curr === vibe.id ? null : vibe.id))}
                className={cx(
                  'flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all active:scale-95',
                  isSelected
                    ? vibe.color + ' shadow-2xs scale-[1.02]'
                    : 'border-line bg-subtle/50 text-ink-3 hover:text-ink hover:bg-subtle',
                )}
              >
                <Icon className="size-3" />
                <span>{vibe.label}</span>
              </button>
            )
          })}
        </div>

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
          placeholder="¿Qué pensamientos, aprendizajes o decisiones marcaron tu día? Escribí aquí libremente..."
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
                onClick={() => {
                  setText('')
                  setSelectedVibe(null)
                }}
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
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Registrar en Bitácora</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de entradas de la Bitácora */}
      <div className="space-y-3">
        <h4 className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
          Historial de reflexiones ({entries.length})
        </h4>

        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-3">
            <p className="text-[14px] font-medium">Tu bitácora personal está esperando tu primera reflexión.</p>
            <p className="mt-1 text-[12px] text-ink-4">Elegí una de las chispas de arriba o escribí lo que sientas hoy.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {entries.map(({ comment }, idx) => {
              const isVibeMatch = comment.body.match(/^\[Sintonía: ([^\]]+)\]\n/)
              const vibeLabel = isVibeMatch ? isVibeMatch[1] : null
              const cleanContent = isVibeMatch
                ? comment.body.replace(/^\[Sintonía: [^\]]+\]\n/, '')
                : comment.body

              return (
                <article
                  key={comment.id || `refl-${idx}`}
                  className="group relative flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3.5 sm:p-4 shadow-2xs hover:border-violet/40 transition-colors"
                >
                  <header className="flex items-center justify-between text-[11px] text-ink-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-ink-3">
                        <Calendar className="size-3 text-violet" />
                        <span>{formatDateTime(comment.createdAt, localeTag)}</span>
                      </span>

                      {vibeLabel && (
                        <span className="rounded-full bg-violet-soft border border-violet/20 px-2 py-0.2 text-[10.5px] font-bold text-violet">
                          {vibeLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
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
                        title="Eliminar de bitácora"
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
