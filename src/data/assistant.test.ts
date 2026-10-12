import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAssistantMessages,
  loadAssistantMessages,
  saveAssistantMessages,
  type AssistantMessage,
} from './assistant'

describe('assistant storage', () => {
  beforeEach(() => {
    clearAssistantMessages()
  })

  it('loads empty array when no messages saved', () => {
    expect(loadAssistantMessages()).toEqual([])
  })

  it('saves and loads messages correctly', () => {
    const testMessages: AssistantMessage[] = [
      { id: '1', role: 'user', content: '¿Cómo voy hoy?', createdAt: 1000 },
      { id: '2', role: 'assistant', content: 'Vas excelente.', createdAt: 2000 },
    ]
    saveAssistantMessages(testMessages)
    expect(loadAssistantMessages()).toEqual(testMessages)
  })

  it('clears messages when requested', () => {
    saveAssistantMessages([
      { id: '1', role: 'user', content: 'Test', createdAt: 1000 },
    ])
    clearAssistantMessages()
    expect(loadAssistantMessages()).toEqual([])
  })

  it('guarantees unique IDs when loading messages with duplicated IDs', () => {
    const duplicatedMessages: AssistantMessage[] = [
      { id: 'usr-1', role: 'user', content: 'First message', createdAt: 1000 },
      { id: 'err-2', role: 'assistant', content: 'First error', createdAt: 2000 },
      { id: 'usr-1', role: 'user', content: 'Second message', createdAt: 3000 },
      { id: 'err-2', role: 'assistant', content: 'Second error', createdAt: 4000 },
    ]
    saveAssistantMessages(duplicatedMessages)
    const loaded = loadAssistantMessages()
    expect(loaded.length).toBe(4)
    const idSet = new Set(loaded.map((m) => m.id))
    expect(idSet.size).toBe(4)
  })
})
