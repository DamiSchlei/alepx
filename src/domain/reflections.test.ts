import { describe, expect, it } from 'vitest'
import {
  getDailyThought,
  getRandomCuratedThought,
  THOUGHTS_ANTHOLOGY,
} from './reflections'

describe('reflections domain', () => {
  it('contains curated anthology items with complete localization and reflection prompts', () => {
    expect(THOUGHTS_ANTHOLOGY.length).toBeGreaterThan(5)
    for (const item of THOUGHTS_ANTHOLOGY) {
      expect(item.id).toBeTruthy()
      expect(item.author).toBeTruthy()
      expect(item.text.es).toBeTruthy()
      expect(item.text.en).toBeTruthy()
      expect(item.prompt.es).toBeTruthy()
      expect(item.prompt.en).toBeTruthy()
    }
  })

  it('determines the daily thought consistently for a given dayKey', () => {
    const thought1 = getDailyThought('2026-09-21', 'es')
    const thought2 = getDailyThought('2026-09-21', 'es')
    expect(thought1.text).toBe(thought2.text)
    expect(thought1.author).toBe(thought2.author)

    const thoughtEn = getDailyThought('2026-09-21', 'en')
    expect(thoughtEn.author).toBe(thought1.author)
    expect(thoughtEn.text).toBeTruthy()
    expect(thoughtEn.reflectionPrompt).toBeTruthy()
  })

  it('provides random curated thoughts excluding a specific id when requested', () => {
    const first = THOUGHTS_ANTHOLOGY[0]!
    const random = getRandomCuratedThought(first.id, 'es')
    expect(random.id).toBeTruthy()
    expect(random.text).toBeTruthy()
  })
})
