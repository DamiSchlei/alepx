import { plannedHoursForDay } from '@/data/dayLoad'
import { tasksForDay } from '@/data/selectors'
import { toDayKey } from '@/domain/dates'
import type { AlephState } from '@/domain/types'

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

const STORAGE_KEY = 'aleph:assistant:history:v1'
let memoryCache: AssistantMessage[] | null = null

export function ensureUniqueIds(messages: AssistantMessage[]): AssistantMessage[] {
  const seen = new Set<string>()
  let hasDuplicate = false
  for (const m of messages) {
    if (!m.id || seen.has(m.id)) {
      hasDuplicate = true
      break
    }
    seen.add(m.id)
  }

  if (!hasDuplicate) return messages

  seen.clear()
  return messages.map((m, idx) => {
    let id = m.id
    if (!id || seen.has(id)) {
      id = `${m.id || 'msg'}_dup_${idx}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    }
    seen.add(id)
    return { ...m, id }
  })
}

export function loadAssistantMessages(): AssistantMessage[] {
  if (typeof localStorage === 'undefined') {
    return memoryCache ? ensureUniqueIds([...memoryCache]) : []
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return memoryCache ? ensureUniqueIds([...memoryCache]) : []
    const parsed = JSON.parse(raw)
    const result: AssistantMessage[] = Array.isArray(parsed) ? parsed : []
    const sanitized = ensureUniqueIds(result)
    memoryCache = [...sanitized]
    return sanitized
  } catch {
    return memoryCache ? ensureUniqueIds([...memoryCache]) : []
  }
}

export function saveAssistantMessages(messages: AssistantMessage[]): void {
  const sanitized = ensureUniqueIds(messages)
  memoryCache = [...sanitized]
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
  } catch {
    // ignore local storage errors
  }
}

export function clearAssistantMessages(): void {
  memoryCache = []
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export async function askAssistant(
  messages: AssistantMessage[],
  state: AlephState,
): Promise<string> {
  const todayKey = toDayKey(new Date())
  const todayTasks = tasksForDay(state, todayKey)
  const plannedHours = plannedHoursForDay(todayTasks)

  const payload = {
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    context: {
      characterName: state.character.name || 'Sin nombre',
      characterLevel: state.character.level,
      characterXp: state.character.xp,
      characterXpToNext: state.character.xpToNext,
      characterMoney: state.character.money,
      skills: state.skills.map((s) => ({
        name: s.name,
        level: s.level,
        xp: s.xp,
      })),
      results: state.results.map((r) => ({
        id: r.id,
        name: r.name,
        progress: r.progress,
        isKey: r.isKey,
      })),
      objectives: state.objectives.map((o) => ({
        id: o.id,
        name: o.name,
        status: o.status,
        resultId: o.resultId,
      })),
      todayTasks: todayTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        estimatedHours: t.estimatedHours,
        actualHours: t.actualHours,
        completedAt: t.completedAt,
      })),
      plannedHours,
      dailyHourCap: state.character.dailyHourCap ?? 5,
      recentJournalComments: (state.journalComments || []).slice(0, 5).map((c) => ({
        body: c.body,
        createdAt: c.createdAt,
        originType: c.originType,
      })),
    },
  }

  const response = await fetch('/api/assistant/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorDetail = 'Error al consultar el asistente'
    try {
      const errJson = await response.json()
      if (errJson?.error) errorDetail = errJson.error
    } catch {
      // ignore
    }
    throw new Error(errorDetail)
  }

  const data = await response.json()
  return data.reply as string
}
