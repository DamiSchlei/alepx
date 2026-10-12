import { useEffect, useRef, useState, type FormEvent } from 'react'
import Markdown from 'react-markdown'
import {
  ArrowUp,
  BookmarkCheck,
  BookmarkPlus,
  RotateCcw,
  Sparkles,
  Target,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'
import {
  askAssistant,
  clearAssistantMessages,
  loadAssistantMessages,
  saveAssistantMessages,
  type AssistantMessage,
} from '@/data/assistant'
import { addComment } from '@/data/actions'
import { useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { Avatar } from '@/components/character/Avatar'
import { cx } from '@/components/ui/primitives'

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  const rand = Math.random().toString(36).slice(2, 7)
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${rand}`
}

const QUICK_SUGGESTIONS = [
  { key: 'tasks', label: '¿Cómo voy hoy con mis tareas?', icon: CheckCircle2 },
  { key: 'objective', label: 'Sugerime un nuevo objetivo', icon: Target },
  { key: 'journal', label: 'Espacio bitácora: reflexionar sobre mi día', icon: BookOpen },
  { key: 'results', label: '¿Cómo relacionar mis tareas con mis resultados?', icon: Sparkles },
] as const

export function CharacterAssistantChat({
  onSavedToJournal,
}: {
  onSavedToJournal?: () => void
}) {
  const state = useAleph()
  const character = state.character
  const feedback = useFeedback()

  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    const saved = loadAssistantMessages()
    if (saved.length > 0) return saved

    // Default welcome message
    const welcomeName = character.name || 'Caminante'
    return [
      {
        id: nextId('welcome'),
        role: 'assistant',
        content: `¡Hola, **${welcomeName}**! Soy el Mentor y Consejero de tu Personaje.\n\nEstoy aquí para dar seguimiento a tus tareas, impulsarte hacia nuevos objetivos y abrir este espacio de **bitácora** donde puedas hablar de ti mismo, tus dudas, tus logros y la relación entre tus acciones diarias y tus resultados.\n\n¿En qué te gustaría que nos enfoquemos hoy?`,
        createdAt: 0,
      },
    ]
  })

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

  // Save messages on update
  useEffect(() => {
    saveAssistantMessages(messages)
  }, [messages])

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim()
    if (!query || loading) return

    const userMsg: AssistantMessage = {
      id: nextId('usr'),
      role: 'user',
      content: query,
      createdAt: Date.now(),
    }

    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const replyText = await askAssistant(updated, state)
      const assistantMsg: AssistantMessage = {
        id: nextId('asst'),
        role: 'assistant',
        content: replyText,
        createdAt: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al conectar con el asistente'
      const errorReply: AssistantMessage = {
        id: nextId('err'),
        role: 'assistant',
        content: `*Nota:* No se pudo contactar al asistente (${errorMsg}). Podés verificar tu conexión o intentar de nuevo.`,
        createdAt: Date.now(),
      }
      setMessages((prev) => [...prev, errorReply])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleSend()
  }

  const handleClearHistory = () => {
    clearAssistantMessages()
    const welcomeName = character.name || 'Caminante'
    setMessages([
      {
        id: nextId('welcome'),
        role: 'assistant',
        content: `Conversación reiniciada. ¡Hola de nuevo, **${welcomeName}**! ¿De qué quieres que hablemos en tu bitácora o sobre tus objetivos?`,
        createdAt: Date.now(),
      },
    ])
    feedback?.notify('Historial de conversación reiniciado')
  }

  const handleSaveToJournal = (msg: AssistantMessage) => {
    const parentId = character.id || 'character'
    const success = addComment('character', parentId, `[Reflexión con Mentor]\n${msg.content}`)
    if (success) {
      setSavedMessageIds((prev) => new Set([...prev, msg.id]))
      feedback?.notify('Reflexión guardada en tu Bitácora')
      onSavedToJournal?.()
    }
  }

  return (
    <div className="flex h-full flex-col min-h-0">
      {/* Header bar inside chat */}
      <div className="flex items-center justify-between border-b border-line px-3 py-2 bg-subtle/50 text-[12px]">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-violet-soft text-violet">
            <Sparkles className="size-3.5" />
          </div>
          <span className="font-semibold text-ink">
            Mentor de {character.name || 'Aleph'} · Nv. {character.level}
          </span>
        </div>
        <button
          type="button"
          onClick={handleClearHistory}
          title="Reiniciar conversación"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-ink-3 hover:bg-subtle hover:text-ink transition-colors"
        >
          <RotateCcw className="size-3" />
          <span className="text-[11px]">Reiniciar</span>
        </button>
      </div>

      {/* Scrollable messages container */}
      <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user'
          const isSaved = savedMessageIds.has(msg.id)
          const messageKey = msg.id ? `${msg.id}_${index}` : `msg_${index}`

          return (
            <div
              key={messageKey}
              className={cx('flex flex-col', isUser ? 'items-end' : 'items-start')}
            >
              <div className="flex items-start gap-2 max-w-[92%] sm:max-w-[85%]">
                {!isUser && (
                  <div className="size-7 shrink-0 rounded-full overflow-hidden border border-violet/30 bg-surface shadow-xs mt-0.5">
                    <Avatar avatar={character.avatar} size={28} className="rounded-full" />
                  </div>
                )}

                <div
                  className={cx(
                    'rounded-2xl px-3.5 py-2.5 shadow-xs text-[14px]',
                    isUser
                      ? 'bg-violet text-white rounded-tr-xs'
                      : 'bg-surface border border-line text-ink rounded-tl-xs',
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="markdown-body space-y-2 text-ink text-[13.5px] leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>strong]:font-bold [&>blockquote]:border-l-2 [&>blockquote]:border-violet [&>blockquote]:pl-2.5 [&>blockquote]:italic [&>blockquote]:text-ink-2">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}

                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between gap-2 text-[11px] text-ink-3">
                      <span>Mentor de Aleph</span>
                      <button
                        type="button"
                        onClick={() => handleSaveToJournal(msg)}
                        disabled={isSaved}
                        className={cx(
                          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-colors',
                          isSaved
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                            : 'text-violet hover:bg-violet-soft active:scale-95',
                        )}
                        title="Guardar esta reflexión en tu Bitácora del Personaje"
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="size-3" />
                            <span>Guardado en Bitácora</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="size-3" />
                            <span>Guardar en Bitácora</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start gap-2 max-w-[85%]">
            <div className="size-7 shrink-0 rounded-full overflow-hidden border border-violet/30 bg-surface shadow-xs mt-0.5">
              <Avatar avatar={character.avatar} size={28} className="rounded-full" />
            </div>
            <div className="rounded-2xl rounded-tl-xs bg-surface border border-line px-4 py-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-violet animate-bounce [animation-delay:-0.3s]" />
                <span className="size-2 rounded-full bg-violet animate-bounce [animation-delay:-0.15s]" />
                <span className="size-2 rounded-full bg-violet animate-bounce" />
                <span className="text-[12px] text-ink-3 ml-1.5 font-medium">
                  El mentor está reflexionando...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions pills */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 py-2 border-t border-line bg-subtle/30">
        {QUICK_SUGGESTIONS.map((sug) => {
          const Icon = sug.icon
          return (
            <button
              key={sug.key}
              type="button"
              disabled={loading}
              onClick={() => handleSend(sug.label)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[11.5px] font-medium text-ink-2 hover:border-violet/40 hover:bg-violet-soft hover:text-violet transition-colors disabled:opacity-50"
            >
              <Icon className="size-3 text-violet" />
              <span>{sug.label}</span>
            </button>
          )
        })}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-line bg-surface p-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Conversar con tu mentor o reflexionar en tu bitácora..."
          disabled={loading}
          className="flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-4 focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          aria-label="Enviar mensaje"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet text-white shadow-xs hover:bg-violet/90 active:scale-95 disabled:opacity-40 transition-all"
        >
          <ArrowUp className="size-5 stroke-[2.5]" />
        </button>
      </form>
    </div>
  )
}
