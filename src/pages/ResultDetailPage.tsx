import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ObjectiveFormSheet } from '@/components/planning/ObjectiveForm'
import { ResultFormSheet } from '@/components/planning/ResultForm'
import { TaskRow } from '@/components/task/TaskRow'
import { Button, EmptyState, Page, SectionTitle, cx } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { SortableList } from '@/components/ui/SortableList'
import { RowMenu } from '@/components/ui/RowMenu'
import { archiveResult, completeTask, reopenTask, reorderObjectives, restoreResult } from '@/data/actions'
import { canAddObjective } from '@/domain/limits'
import {
  activeObjectivesOfResult,
  completedObjectivesOfResult,
  deriveObjectiveStage,
  resultById,
  tasksOfObjective,
} from '@/data/selectors'
import { useAleph } from '@/data/store'
import { formatDate } from '@/i18n/format'
import { stageShort } from '@/i18n/labels'
import { isTaskDone } from '@/domain/economy'
import type { Objective, Task } from '@/domain/types'

function ObjectiveRow({
  objective,
  handle,
}: {
  objective: Objective
  handle?: ReactNode
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const done = objective.status === 'done'
  const tasks = tasksOfObjective(state, objective.id)

  const toggleTask = (task: Task) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
    } else {
      completeTask(task.id)
    }
  }

  const meta = [
    objective.targetDate ? formatDate(objective.targetDate, locale) : null,
    !done ? stageShort(t, deriveObjectiveStage(state, objective.id)) : t(`objectiveStatus.${objective.status}`),
    `${tasks.length} ${tasks.length === 1 ? 'paso' : 'pasos'}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex flex-col gap-2 rounded-[16px] border border-line bg-subtle p-3">
      <div className="flex items-center justify-between">
        <Link
          to={`/planning/objectives/${objective.id}`}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {done ? (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-[#0f9f6e] text-white">
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className={cx('line-clamp-1 text-[16px] font-semibold leading-snug', done ? 'text-ink-3' : 'text-ink')}>
              {objective.name}
            </p>
            <p className="mt-0.5 truncate text-[12px] font-medium leading-tight text-ink-3">{meta}</p>
          </div>
          <span aria-hidden className="text-ink-3 pr-1 text-[18px]">
            ›
          </span>
        </Link>
        {handle ? <div className="opacity-40 pl-1">{handle}</div> : null}
      </div>

      {/* Pasos con etiqueta de terreno y CTA "Poner en esta semana" */}
      {tasks.length > 0 ? (
        <div className="flex flex-col gap-1.5 pt-1">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task)}
              showContext={false}
            />
          ))}
        </div>
      ) : (
        <p className="px-1 py-1 text-[13px] text-ink-3">Sin pasos definidos.</p>
      )}
    </div>
  )
}

export function ResultDetailPage() {
  const { resultId = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const state = useAleph()
  const result = resultById(state, resultId)
  const active = result ? activeObjectivesOfResult(state, result.id) : []
  const completed = result ? completedObjectivesOfResult(state, result.id) : []
  const [edit, setEdit] = useState(false)
  const [addObjective, setAddObjective] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const atLimit = !canAddObjective(state.objectives, resultId)
  const isArchived = result?.status === 'archived'

  if (!result) {
    return (
      <div className="pt-6">
        <EmptyState
          action={
            <Button variant="secondary" onClick={() => navigate('/planning')}>
              Volver
            </Button>
          }
        >
          No se encontró la obra.
        </EmptyState>
      </div>
    )
  }

  const meta = [
    result.targetDate ? formatDate(result.targetDate, state.character.locale) : null,
    'En curso',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Page className="flex flex-col gap-4 pt-2 pb-24">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate('/planning')}
          className="min-h-11 text-left text-[14px] font-medium text-ink-3 hover:text-ink transition-colors"
        >
          ← Planificación
        </button>
        {isArchived ? (
          <Button variant="secondary" className="min-h-11 px-3" onClick={() => restoreResult(result.id)}>
            Restaurar
          </Button>
        ) : (
          <RowMenu
            items={[
              { label: 'Editar', onClick: () => setEdit(true) },
              { label: 'Archivar', tone: 'danger', onClick: () => setArchiveOpen(true) },
            ]}
          />
        )}
      </div>

      {/* Obra con riel neutro */}
      <header className="relative overflow-hidden rounded-[16px] border border-line bg-white py-3 pr-3 pl-4">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-[#9aa0ae]" />
        <div className="pl-1">
          <h1 className="line-clamp-2 text-[18px] font-bold leading-snug text-ink">{result.name}</h1>
          <p className="mt-0.5 truncate text-[12px] font-medium leading-tight text-ink-3">{meta}</p>
          {result.why ? (
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{result.why}</p>
          ) : null}
        </div>
      </header>

      <div>
        <SectionTitle
          action={
            isArchived ? null : (
              <button
                type="button"
                disabled={atLimit}
                aria-label="Nuevo objetivo"
                onClick={() => setAddObjective(true)}
                className="flex size-9 items-center justify-center rounded-full border border-line text-[#7a3fe0] hover:bg-[#f5f0ff] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                +
              </button>
            )
          }
        >
          Objetivos y Pasos
        </SectionTitle>
        {atLimit && !isArchived ? (
          <p className="mb-3 text-[13px] leading-relaxed text-amber">{t('planning.objectives.limitReached')}</p>
        ) : null}
        {active.length === 0 ? (
          <EmptyState>
            {completed.length > 0 ? 'No hay objetivos activos' : 'No hay objetivos'}
          </EmptyState>
        ) : (
          <SortableList
            ids={active.map((o) => o.id)}
            onReorder={(ids) => reorderObjectives(result.id, ids)}
            handleLabel="Reordenar"
          >
            {(id, handle) => {
              const objective = active.find((o) => o.id === id)
              if (!objective) return null
              return <ObjectiveRow objective={objective} handle={handle} />
            }}
          </SortableList>
        )}
      </div>

      {completed.length > 0 ? (
        <div>
          <SectionTitle>Objetivos cumplidos</SectionTitle>
          <ul className="flex flex-col gap-2">
            {completed.map((objective) => (
              <li key={objective.id}>
                <ObjectiveRow objective={objective} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ResultFormSheet open={edit} result={result} onClose={() => setEdit(false)} />
      <ObjectiveFormSheet
        open={addObjective}
        resultId={result.id}
        onClose={() => setAddObjective(false)}
      />
      <ConfirmDialog
        open={archiveOpen}
        title="Archivar"
        message="¿Archivar esta obra?"
        tone="danger"
        onCancel={() => setArchiveOpen(false)}
        onConfirm={() => {
          archiveResult(result.id)
          navigate('/planning')
        }}
      />
    </Page>
  )
}
