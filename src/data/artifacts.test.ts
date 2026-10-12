import { describe, expect, it, beforeEach } from 'vitest'
import {
  createArtifact,
  updateArtifact,
  deleteArtifact,
  convertArtifactToTask,
} from './actions'
import {
  allArtifacts,
  artifactById,
  filterArtifacts,
} from './selectors'
import { getState, setState } from './store'
import { initialState } from './seed'

describe('Obra & Second Brain Artifacts', () => {
  beforeEach(() => {
    setState(() => initialState('es'))
  })

  it('creates an artifact and stores it in state', () => {
    const art = createArtifact({
      title: 'Decisión de arquitectura',
      content: 'Utilizar SQLite para persistencia local offline-first.',
      terreno: 'empresa',
      type: 'decision',
      tags: ['arquitectura', 'db'],
    })

    expect(art.id).toBeDefined()
    expect(art.title).toBe('Decisión de arquitectura')
    expect(art.terreno).toBe('empresa')
    expect(art.type).toBe('decision')

    const state = getState()
    const stored = (state.artifacts || []).find((a) => a.id === art.id)
    expect(stored).toBeDefined()
    expect(stored?.content).toBe('Utilizar SQLite para persistencia local offline-first.')
  })

  it('updates an artifact', () => {
    const art = createArtifact({
      title: 'Nota preliminar',
      terreno: 'literatura',
    })

    updateArtifact(art.id, {
      title: 'Borrador consolidado',
      content: 'Texto del primer capítulo.',
    })

    const updated = artifactById(getState(), art.id)
    expect(updated?.title).toBe('Borrador consolidado')
    expect(updated?.content).toBe('Texto del primer capítulo.')
  })

  it('deletes an artifact', () => {
    const art = createArtifact({
      title: 'Para borrar',
      terreno: 'arte',
    })

    deleteArtifact(art.id)
    expect(artifactById(getState(), art.id)).toBeUndefined()
  })

  it('converts an artifact to a task on the specified day', () => {
    const art = createArtifact({
      title: 'Diseñar logo de la obra',
      content: 'Revisar paleta violeta y tipografía Fraunces',
      terreno: 'arte',
      resultId: 'result_obra_1',
    })

    const task = convertArtifactToTask(art.id, '2026-10-15')
    expect(task).toBeDefined()
    expect(task?.title).toBe('Diseñar logo de la obra')
    expect(task?.notes).toBe('Revisar paleta violeta y tipografía Fraunces')
    expect(task?.terreno).toBe('arte')
    expect(task?.scheduledFor).toBe('2026-10-15')
  })

  it('filters artifacts by terreno, type, and query', () => {
    const art1 = createArtifact({
      title: 'Copywriter landing',
      terreno: 'literatura',
      type: 'deliverable',
      tags: ['web'],
    })
    const art2 = createArtifact({
      title: 'Diseño paleta',
      terreno: 'arte',
      type: 'reference',
      tags: ['color'],
    })

    const all = allArtifacts(getState())

    const litOnly = filterArtifacts(all, { terreno: 'literatura' })
    expect(litOnly.some((a) => a.id === art1.id)).toBe(true)
    expect(litOnly.some((a) => a.id === art2.id)).toBe(false)

    const querySearch = filterArtifacts(all, { query: 'paleta' })
    expect(querySearch.some((a) => a.id === art2.id)).toBe(true)
    expect(querySearch.some((a) => a.id === art1.id)).toBe(false)
  })
})
