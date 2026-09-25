import { useState, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Feather,
  Quote,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import {
  getDailyThought,
  fetchRemoteThought,
  type DailyThought,
  type ThoughtTheme,
} from '@/domain/reflections'

interface DailyThoughtCardProps {
  activeDay: string
  localeTag: string
}

const THEME_ACCENTS: Record<
  ThoughtTheme,
  { bg: string; text: string; border: string; dot: string }
> = {
  obra: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
  },
  tiempo: {
    bg: 'bg-violet-50',
    text: 'text-violet-900',
    border: 'border-violet-200',
    dot: 'bg-violet-600',
  },
  atencion: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-200',
    dot: 'bg-amber-600',
  },
  silencio: {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
  },
  voluntad: {
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
  },
  perspectiva: {
    bg: 'bg-sky-50',
    text: 'text-sky-900',
    border: 'border-sky-200',
    dot: 'bg-sky-600',
  },
  memoria: {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    border: 'border-purple-200',
    dot: 'bg-purple-600',
  },
}

export function DailyThoughtCard({ activeDay, localeTag }: DailyThoughtCardProps) {
  const { t } = useTranslation()
  const lang = localeTag.startsWith('en') ? 'en' : 'es'

  const [thought, setThought] = useState<DailyThought>(() => getDailyThought(activeDay, lang))
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [isFolded, setIsFolded] = useState(false)

  const themeStyle = THEME_ACCENTS[thought.theme] ?? THEME_ACCENTS.tiempo

  const handleCopy = async () => {
    try {
      const fullText = `"${thought.text}"\n— ${thought.author}${thought.work ? ` (${thought.work})` : ''}`
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleFetchNew = () => {
    startTransition(async () => {
      const fresh = await fetchRemoteThought(lang)
      setThought(fresh)
    })
  }

  return (
    <section
      aria-label={t('reflection.title')}
      className="w-full overflow-hidden rounded-[24px] border border-line bg-surface p-4 shadow-[var(--shadow-paper)] transition-all sm:p-5"
    >
      {/* Top Bar: Icon + Header + Theme Badge + Controls */}
      <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 items-center justify-center rounded-lg bg-violet-soft text-violet shrink-0">
            <Feather className="size-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13px] font-bold tracking-tight text-ink truncate">
              {t('reflection.title')}
            </h4>
            <p className="text-[11px] text-ink-3 truncate hidden sm:block">
              {t('reflection.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${themeStyle.bg} ${themeStyle.text} border ${themeStyle.border}`}
          >
            <span className={`size-1.5 rounded-full ${themeStyle.dot}`} />
            {t(`reflection.theme.${thought.theme}`)}
          </span>

          <button
            type="button"
            onClick={handleFetchNew}
            disabled={isPending}
            className="flex size-7 items-center justify-center rounded-lg border border-line bg-subtle/50 text-ink-3 hover:text-ink hover:bg-subtle transition-all active:scale-95 disabled:opacity-50"
            title={t('reflection.refresh')}
            aria-label={t('reflection.refresh')}
          >
            <RefreshCw className={`size-3.5 ${isPending ? 'animate-spin text-violet' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsFolded((f) => !f)}
            className="flex size-7 items-center justify-center rounded-lg border border-line bg-subtle/50 text-ink-3 hover:text-ink hover:bg-subtle transition-all active:scale-95"
            title={isFolded ? t('reflection.unfold') : t('reflection.fold')}
            aria-label={isFolded ? t('reflection.unfold') : t('reflection.fold')}
          >
            {isFolded ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Quote Body */}
      {!isFolded && (
        <div className="mt-3.5 flex flex-col gap-3">
          <div className="relative pl-3 border-l-2 border-violet/30">
            <Quote className="absolute -top-1 -left-2.5 size-4 text-violet/40 fill-violet/10 bg-surface" />
            <blockquote className="font-display text-[15px] sm:text-[16.5px] leading-relaxed text-ink font-normal tracking-tight">
              «{thought.text}»
            </blockquote>
            <cite className="mt-2 block not-italic text-[12px] font-semibold text-ink-3">
              — <span className="text-ink-2">{thought.author}</span>
              {thought.work ? (
                <span className="italic font-normal text-ink-3">, {thought.work}</span>
              ) : null}
            </cite>
          </div>

          {/* Reflection Prompt Box */}
          <div className="flex items-start gap-2.5 rounded-xl bg-subtle/60 border border-line/70 p-2.5 sm:p-3">
            <Sparkles className="size-4 text-violet shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium leading-snug text-ink-2">
                {thought.reflectionPrompt}
              </p>
            </div>
          </div>

          {/* Action Footer: Copiar cita */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/40">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-3 hover:text-ink transition-colors px-1.5 py-1 rounded-md hover:bg-subtle"
              title={t('reflection.copy')}
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600 stroke-[2.5]" />
                  <span className="text-emerald-700">{t('reflection.copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>{t('reflection.copy')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
