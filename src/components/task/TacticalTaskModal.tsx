import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  CheckCircle2,
  Clock,
  Coins,
  BarChart3,
  Users,
  Plus,
  Trash2,
  ExternalLink,
  Phone,
  Mail,
  Building,
  TrendingUp,
  TrendingDown,
  Play,
  Flame,
  Calendar,
  Target,
} from 'lucide-react'
import { computeEndTime } from '@/domain/clockHours'
import { MindMapCanvas } from './MindMapCanvas'
import { TaskTemplatePicker, TaskTemplateTrigger } from './TaskTemplatePicker'
import { useFeedback } from '@/app/FeedbackProvider'
import {
  addTaskCheckItem,
  addTaskContact,
  addTaskMetric,
  addTaskMoneyTransaction,
  addTaskWorkLog,
  addRecordedTimeToTask,
  completeTask,
  removeTaskCheckItem,
  removeTaskContact,
  removeTaskMetric,
  removeTaskMoneyTransaction,
  removeTaskWorkLog,
  reopenTask,
  toggleTaskCheckItem,
  updateTask,
  updateTaskMetric,
  updateTaskThoughtMap,
} from '@/data/actions'
import { startExecution, useFocusSession } from '@/data/focusSession'
import { blockContext } from '@/data/selectors'
import { getState, useAleph } from '@/data/store'
import { toDayKey } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { TERRENO_MAP } from '@/domain/terrenos'
import { resolveTaskViewTemplate } from '@/domain/taskView'
import type {
  ContactCategory,
  TaskViewTemplate,
  ThoughtMap,
} from '@/domain/types'

interface TacticalTaskModalProps {
  taskId: string | null
  onClose: () => void
}

export function TacticalTaskModal({ taskId, onClose }: TacticalTaskModalProps) {
  const { t } = useTranslation()
  const state = useAleph()
  const feedback = useFeedback()
  const focusSession = useFocusSession()
  const [pickerOpen, setPickerOpen] = useState(() => {
    if (!taskId) return false
    const current = getState().tasks.find((item) => item.id === taskId)
    return current ? resolveTaskViewTemplate(current) === null : true
  })

  // New item draft states
  const [newCheckText, setNewCheckText] = useState('')
  const [timeAddMinutes, setTimeAddMinutes] = useState(30)

  // Metrics form
  const [metricName, setMetricName] = useState('')
  const [metricValue, setMetricValue] = useState<number>(1)
  const [metricTarget, setMetricTarget] = useState<number | undefined>()
  const [metricUnit, setMetricUnit] = useState('')

  // Money form
  const [txType, setTxType] = useState<'income' | 'expense'>('income')
  const [txAmount, setTxAmount] = useState<number>(1000)
  const [txConcept, setTxConcept] = useState('')
  const [txCurrency, setTxCurrency] = useState('$')

  // Work done log form
  const [workSummary, setWorkSummary] = useState('')
  const [workDeliverableUrl, setWorkDeliverableUrl] = useState('')

  // Contact form
  const [contactName, setContactName] = useState('')
  const [contactRole, setContactRole] = useState('')
  const [contactOrg, setContactOrg] = useState('')
  const [contactCategory, setContactCategory] = useState<ContactCategory>('client')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactStatus, setContactStatus] = useState('Activo')
  const [contactNotes, setContactNotes] = useState('')
  const [showAddContactForm, setShowAddContactForm] = useState(false)

  const task = useMemo(() => {
    if (!taskId) return null
    return state.tasks.find((t) => t.id === taskId) ?? null
  }, [state.tasks, taskId])

  const resolvedTemplate = task ? resolveTaskViewTemplate(task) : null
  const activeTemplate: TaskViewTemplate = resolvedTemplate ?? 'checklist'

  if (!task) return null

  const isDone = isTaskDone(task.status)
  const isExecuting = focusSession.activeTaskId === task.id
  const ctx = blockContext(state, task)
  const projectColor = ctx.projectColor || ctx.color || '#7a3fe0'
  const terrenoInfo = TERRENO_MAP[ctx.terreno ?? 'literatura']

  // Financial summary
  const transactions = task.moneyTransactions || []
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0)
  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0)
  const netBalance = totalIncome - totalExpense

  // Checklist counts
  const checklist = task.checklist || []
  const doneCount = checklist.filter((item) => item.done).length
  const checklistProgress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0

  // Time metrics
  const estimatedHours = task.estimatedHours ?? 1
  const actualHours = task.actualHours ?? 0

  // Handlers
  const handleToggleDone = () => {
    if (isDone) {
      reopenTask(task.id)
    } else {
      const outcome = completeTask(task.id)
      if (outcome) feedback.celebrate(outcome)
    }
  }

  const handleStartFocus = () => {
    startExecution(task, task.scheduledFor || new Date().toISOString().slice(0, 10))
  }

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCheckText.trim()) return
    addTaskCheckItem(task.id, newCheckText)
    setNewCheckText('')
  }

  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault()
    if (!metricName.trim()) return
    addTaskMetric(task.id, {
      name: metricName,
      value: metricValue,
      target: metricTarget,
      unit: metricUnit,
    })
    setMetricName('')
    setMetricValue(1)
    setMetricTarget(undefined)
    setMetricUnit('')
  }

  const handleAddMoney = (e: React.FormEvent) => {
    e.preventDefault()
    if (!txConcept.trim() || txAmount <= 0) return
    addTaskMoneyTransaction(task.id, {
      type: txType,
      amount: txAmount,
      concept: txConcept,
      currency: txCurrency,
    })
    setTxConcept('')
    setTxAmount(1000)
  }

  const handleAddWorkLog = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workSummary.trim()) return
    addTaskWorkLog(task.id, {
      summary: workSummary,
      deliverableUrl: workDeliverableUrl,
    })
    setWorkSummary('')
    setWorkDeliverableUrl('')
  }

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName.trim()) return
    addTaskContact(task.id, {
      name: contactName,
      role: contactRole,
      organization: contactOrg,
      category: contactCategory,
      phone: contactPhone,
      email: contactEmail,
      status: contactStatus,
      notes: contactNotes,
    })
    setContactName('')
    setContactRole('')
    setContactOrg('')
    setContactPhone('')
    setContactEmail('')
    setContactNotes('')
    setShowAddContactForm(false)
  }

  const handleThoughtMapChange = (newMap: ThoughtMap) => {
    updateTaskThoughtMap(task.id, newMap)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-line overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex flex-col gap-2 p-4 sm:p-5 border-b border-line bg-gradient-to-b from-slate-50/80 to-white shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Checkbox button */}
              <button
                type="button"
                onClick={handleToggleDone}
                className={`size-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                  isDone
                    ? 'border-transparent text-white shadow-xs'
                    : 'border-line hover:border-line-strong bg-white'
                }`}
                style={{ backgroundColor: isDone ? projectColor : undefined }}
                title={isDone ? 'Marcar como pendiente' : 'Completar tarea'}
              >
                {isDone ? (
                  <CheckCircle2 className="size-4 stroke-[2.5]" />
                ) : (
                  <span className="size-2 rounded-full bg-slate-300" />
                )}
              </button>

              {/* Title & context */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: projectColor }}
                  />
                  <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider truncate">
                    {[
                      ctx.project?.name,
                      ctx.result ? `Resultado · ${ctx.result.name}` : null,
                      ctx.objective ? `Objetivo · ${ctx.objective.name}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Tarea'}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `${terrenoInfo.color}18`,
                      color: terrenoInfo.color,
                    }}
                  >
                    {terrenoInfo.label}
                  </span>
                  {isExecuting && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full animate-pulse">
                      <Flame className="size-3 fill-amber-500 text-amber-500" />
                      <span>EN EJECUCIÓN</span>
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                  Tarea
                </span>
                <h2 className="text-[18px] sm:text-[20px] font-black text-ink tracking-tight leading-snug">
                  {task.title}
                </h2>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-subtle transition-colors shrink-0"
              title="Cerrar ventana"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Quick Metrics Header Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-semibold text-ink-2 pt-1 border-t border-line/50">
            <span className="flex items-center gap-1 bg-subtle px-2 py-0.8 rounded-lg">
              <Clock className="size-3.5 text-purple-600" />
              <span>{Math.round(actualHours * 60)}m dedicados / {estimatedHours}h est.</span>
            </span>

            {checklist.length > 0 && (
              <span className="flex items-center gap-1 bg-subtle px-2 py-0.8 rounded-lg">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>{doneCount}/{checklist.length} pasos ({checklistProgress}%)</span>
              </span>
            )}

            {transactions.length > 0 && (
              <span className={`flex items-center gap-1 px-2 py-0.8 rounded-lg ${
                netBalance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                <Coins className="size-3.5" />
                <span>Neto: {netBalance >= 0 ? `+$${netBalance.toLocaleString()}` : `-$${Math.abs(netBalance).toLocaleString()}`}</span>
              </span>
            )}

            {(task.contacts?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1 bg-subtle px-2 py-0.8 rounded-lg">
                <Users className="size-3.5 text-indigo-600" />
                <span>{task.contacts?.length} contactos</span>
              </span>
            )}

            {(task.metrics?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1 bg-subtle px-2 py-0.8 rounded-lg">
                <BarChart3 className="size-3.5 text-amber-600" />
                <span>{task.metrics?.length} variables</span>
              </span>
            )}
          </div>
        </div>

        {/* Agenda, Schedule & Objective Synchronization Bar */}
        {(() => {
          const todayKey = toDayKey(new Date())
          const isToday = task.scheduledFor === todayKey || task.dueAt === todayKey
          return (
            <div className="flex flex-col gap-2.5 px-4 sm:px-5 py-3 bg-slate-50/90 border-b border-line text-[12px] shrink-0">
              {/* Row 1: Objective Assignment & Agenda Status */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-ink shrink-0">
                    <Target className="size-4 text-violet" />
                    <span>Objetivo:</span>
                  </div>
                  <select
                    value={task.objectiveId ?? ''}
                    onChange={(e) => {
                      const newObjId = e.target.value
                      if (newObjId) {
                        const targetObj = state.objectives.find((o) => o.id === newObjId)
                        if (targetObj) {
                          updateTask(task.id, {
                            objectiveId: targetObj.id,
                            resultId: targetObj.resultId,
                          })
                        }
                      } else {
                        updateTask(task.id, { objectiveId: undefined })
                      }
                    }}
                    className="max-w-[240px] truncate rounded-xl border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink shadow-2xs hover:border-violet focus:outline-hidden focus:ring-1 focus:ring-violet"
                  >
                    <option value="">Sin objetivo (paso suelto)</option>
                    {state.results.map((res) => {
                      const resObjs = state.objectives.filter((o) => o.resultId === res.id)
                      if (resObjs.length === 0) return null
                      return (
                        <optgroup
                          key={res.id}
                          label={`${res.projectName ? `${res.projectName} · ` : ''}${res.name}`}
                        >
                          {resObjs.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </optgroup>
                      )
                    })}
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-ink-3 text-[11px]">Agenda:</span>
                  {isToday ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full text-[10px]">
                      <span>☀️ En Hoy (Home)</span>
                    </span>
                  ) : task.scheduledFor ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px]">
                      <Calendar className="size-2.5" />
                      <span>{task.scheduledFor}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px]">
                      <span>⚪ Backlog</span>
                    </span>
                  )}

                  {!isToday ? (
                    <button
                      type="button"
                      onClick={() => {
                        updateTask(task.id, { scheduledFor: todayKey, dueAt: todayKey, stage: 'execution' })
                      }}
                      className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors shadow-2xs"
                    >
                      + Poner en Hoy
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        updateTask(task.id, { scheduledFor: undefined, dueAt: undefined })
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white border border-line text-ink-3 hover:text-rose-600 font-semibold text-[10px] hover:bg-rose-50 transition-colors"
                    >
                      Mover a Backlog
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Clock Schedule Setting (Horario en el Reloj) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 font-bold text-ink shrink-0">
                    <Clock className="size-3.5 text-violet" />
                    <span>Horario en el reloj:</span>
                  </div>

                  <input
                    type="time"
                    value={task.scheduledStart || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val) {
                        const endVal = computeEndTime(val, task.estimatedHours ?? 1)
                        updateTask(task.id, { scheduledStart: val, scheduledEnd: endVal })
                      } else {
                        updateTask(task.id, { scheduledStart: undefined, scheduledEnd: undefined })
                      }
                    }}
                    className="h-7 rounded-lg border border-line bg-white px-2 text-[11px] font-semibold text-ink shadow-2xs focus:border-violet focus:outline-hidden"
                  />

                  <div className="flex items-center gap-1">
                    {['09:00', '12:00', '15:00', '18:30'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const endVal = computeEndTime(preset, task.estimatedHours ?? 1)
                          updateTask(task.id, { scheduledStart: preset, scheduledEnd: endVal })
                        }}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${
                          task.scheduledStart === preset
                            ? 'bg-violet text-white shadow-2xs'
                            : 'bg-white border border-line text-ink-2 hover:bg-violet-soft hover:text-violet'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                    {task.scheduledStart && (
                      <button
                        type="button"
                        onClick={() => updateTask(task.id, { scheduledStart: undefined, scheduledEnd: undefined })}
                        className="text-[10px] font-medium text-ink-3 hover:text-rose-600 hover:underline px-1.5"
                      >
                        Sin hora fija
                      </button>
                    )}
                  </div>
                </div>

                {task.scheduledStart ? (
                  <span className="text-[11px] font-bold text-violet">
                    🕒 {task.scheduledStart} - {task.scheduledEnd || computeEndTime(task.scheduledStart, task.estimatedHours ?? 1)}
                  </span>
                ) : (
                  <span className="text-[10px] text-ink-3">
                    Reloj automático según orden del día
                  </span>
                )}
              </div>
            </div>
          )
        })()}

        {/* One template per task: dropdown opens the visor */}
        <div className="flex items-center justify-between gap-3 border-b border-line bg-subtle/40 px-4 py-2.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              {t('taskView.label')}
            </p>
            <p className="truncate text-[12px] text-ink-3">{t('taskView.onePerTask')}</p>
          </div>
          <TaskTemplateTrigger
            template={resolvedTemplate}
            open={pickerOpen}
            onClick={() => setPickerOpen((open) => !open)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {pickerOpen ? (
            <TaskTemplatePicker
              task={task}
              selected={resolvedTemplate}
              onSelect={(template) => {
                updateTask(task.id, { viewTemplate: template })
                setPickerOpen(false)
              }}
            />
          ) : (
            <>
          {activeTemplate === 'checklist' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-ink">Pasos y Lista de Checklist</h3>
                  <p className="text-[12px] text-ink-3">Desglosá la ejecución en hitos accionables.</p>
                </div>
                {checklist.length > 0 && (
                  <span className="text-[12px] font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    {doneCount} de {checklist.length} listos ({checklistProgress}%)
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {checklist.length > 0 && (
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
              )}

              {/* Add checklist item */}
              <form onSubmit={handleAddChecklist} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCheckText}
                  onChange={(e) => setNewCheckText(e.target.value)}
                  placeholder="Agregar nuevo paso o verificación..."
                  className="flex-1 rounded-xl border border-line bg-white px-3.5 py-2 text-[13px] text-ink placeholder:text-ink-4 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600/20"
                />
                <button
                  type="submit"
                  disabled={!newCheckText.trim()}
                  className="flex items-center gap-1 rounded-xl bg-[#111318] px-3.5 py-2 text-[12px] font-bold text-white hover:bg-black disabled:opacity-40 transition-all shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span>Paso</span>
                </button>
              </form>

              {/* Checklist items list */}
              <div className="flex flex-col gap-2 mt-1">
                {checklist.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-line rounded-2xl text-[13px] text-ink-3">
                    Aún no hay pasos en el checklist. Anotá los micro-objetivos para completar la tarea.
                  </div>
                ) : (
                  checklist.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                        item.done ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-line hover:border-line-strong'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTaskCheckItem(task.id, item.id)}
                        className="flex items-center gap-2.5 flex-1 text-left"
                      >
                        <div
                          className={`size-5 rounded-md border flex items-center justify-center transition-all ${
                            item.done
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-line-strong bg-white hover:border-purple-500'
                          }`}
                        >
                          {item.done && <CheckCircle2 className="size-3.5 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-[13px] font-medium leading-tight ${
                            item.done ? 'line-through text-ink-3' : 'text-ink'
                          }`}
                        >
                          {item.text}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeTaskCheckItem(task.id, item.id)}
                        className="text-ink-4 hover:text-red-500 p-1 transition-colors"
                        title="Eliminar paso"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MEDIDA DE TIEMPO */}
          {activeTemplate === 'time' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-line">
                <div>
                  <h3 className="text-[15px] font-black text-ink">Control de Tiempo Táctico</h3>
                  <p className="text-[12px] text-ink-3">
                    Estimado: <strong>{estimatedHours}h</strong> · Real dedicado: <strong>{Math.round(actualHours * 60)} min</strong> ({actualHours.toFixed(2)}h)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartFocus}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all shadow-xs ${
                    isExecuting ? 'bg-amber-500 hover:bg-amber-600 animate-pulse' : 'bg-[#111318] hover:bg-black'
                  }`}
                >
                  <Play className="size-4 fill-current" />
                  <span>{isExecuting ? 'En ejecución activa' : 'Iniciar Foco / Ejecutar'}</span>
                </button>
              </div>

              {/* Quick time additions */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold text-ink-2">Sumar tiempo manual a esta tarea:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => addRecordedTimeToTask(task.id, 0.25)}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-line bg-white hover:bg-purple-50 hover:border-purple-300 text-[13px] font-bold text-ink transition-all active:scale-95"
                  >
                    <span>+ 15 min</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addRecordedTimeToTask(task.id, 0.5)}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-line bg-white hover:bg-purple-50 hover:border-purple-300 text-[13px] font-bold text-ink transition-all active:scale-95"
                  >
                    <span>+ 30 min</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addRecordedTimeToTask(task.id, 1)}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-line bg-white hover:bg-purple-50 hover:border-purple-300 text-[13px] font-bold text-ink transition-all active:scale-95"
                  >
                    <span>+ 1 hora</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addRecordedTimeToTask(task.id, 2)}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-line bg-white hover:bg-purple-50 hover:border-purple-300 text-[13px] font-bold text-ink transition-all active:scale-95"
                  >
                    <span>+ 2 horas</span>
                  </button>
                </div>
              </div>

              {/* Custom time adjustments */}
              <div className="flex items-center gap-2 p-3 bg-subtle/70 rounded-xl border border-line">
                <span className="text-[12px] font-medium text-ink-2">Ajustar tiempo exacto:</span>
                <input
                  type="number"
                  min={1}
                  step={5}
                  value={timeAddMinutes}
                  onChange={(e) => setTimeAddMinutes(Number(e.target.value) || 0)}
                  className="w-20 bg-white rounded-lg border border-line px-2 py-1 text-[13px] font-bold text-ink text-center"
                />
                <span className="text-[12px] text-ink-3">minutos</span>
                <button
                  type="button"
                  onClick={() => {
                    if (timeAddMinutes > 0) {
                      addRecordedTimeToTask(task.id, timeAddMinutes / 60)
                    }
                  }}
                  className="ml-auto rounded-lg bg-[#111318] text-white px-3 py-1 text-[12px] font-bold hover:bg-black"
                >
                  Sumar minutos
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VARIABLES & MÉTRICAS */}
          {activeTemplate === 'metrics' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-[14px] font-bold text-ink">Registro de Variables y Métricas Producidas</h3>
                <p className="text-[12px] text-ink-3">Registrá volumen numérico: páginas redactadas, llamadas, unidades fabricadas, código, etc.</p>
              </div>

              {/* Form to add metric */}
              <form onSubmit={handleAddMetric} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 bg-subtle/70 rounded-2xl border border-line">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={metricName}
                    onChange={(e) => setMetricName(e.target.value)}
                    placeholder="Variable (ej. Páginas, Llamadas, Leads)..."
                    className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink placeholder:text-ink-4 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={metricValue}
                    onChange={(e) => setMetricValue(Number(e.target.value) || 0)}
                    placeholder="Valor"
                    className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink text-center font-bold focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={metricUnit}
                    onChange={(e) => setMetricUnit(e.target.value)}
                    placeholder="Unidad (u, km, pág)"
                    className="w-full rounded-xl border border-line bg-white px-2 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-purple-600"
                  />
                  <button
                    type="submit"
                    disabled={!metricName.trim()}
                    className="rounded-xl bg-[#111318] text-white px-3 py-1.5 text-[12px] font-bold hover:bg-black disabled:opacity-40 shrink-0"
                  >
                    + Registrar
                  </button>
                </div>
              </form>

              {/* Metric cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {(task.metrics || []).length === 0 ? (
                  <div className="sm:col-span-2 p-6 text-center border border-dashed border-line rounded-2xl text-[13px] text-ink-3">
                    No hay variables numéricas registradas todavía para esta tarea.
                  </div>
                ) : (
                  task.metrics?.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-line shadow-xs"
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">{m.name}</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-[20px] font-black text-ink tabular-nums">{m.value}</span>
                          {m.unit && <span className="text-[12px] font-semibold text-ink-3">{m.unit}</span>}
                        </div>
                      </div>

                      {/* Quick +1 / -1 buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateTaskMetric(task.id, m.id, { value: Math.max(0, m.value - 1) })}
                          className="size-7 rounded-lg border border-line flex items-center justify-center font-bold text-ink hover:bg-subtle active:scale-95"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTaskMetric(task.id, m.id, { value: m.value + 1 })}
                          className="size-7 rounded-lg bg-[#111318] text-white flex items-center justify-center font-bold hover:bg-black active:scale-95"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTaskMetric(task.id, m.id)}
                          className="size-7 rounded-lg text-ink-4 hover:text-red-600 flex items-center justify-center ml-1"
                          title="Eliminar variable"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DINERO / FINANZAS */}
          {activeTemplate === 'money' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-line">
                <div>
                  <h3 className="text-[15px] font-black text-ink">Finanzas & Movimientos de Dinero</h3>
                  <p className="text-[12px] text-ink-3">Asociá ingresos (cobros/anticipos) o egresos (gastos/proveedores) a esta tarea.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-ink-3 uppercase">Balance Neto</span>
                    <span className={`text-[17px] font-black ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {netBalance >= 0 ? `+$${netBalance.toLocaleString()}` : `-$${Math.abs(netBalance).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add transaction form */}
              <form onSubmit={handleAddMoney} className="flex flex-col gap-2 p-3.5 bg-subtle/70 rounded-2xl border border-line">
                <div className="flex items-center gap-2">
                  {/* Selector type */}
                  <div className="flex rounded-xl bg-white p-0.5 border border-line shrink-0">
                    <button
                      type="button"
                      onClick={() => setTxType('income')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                        txType === 'income' ? 'bg-emerald-500 text-white shadow-xs' : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      <TrendingUp className="size-3.5" />
                      <span>Ingreso</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('expense')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                        txType === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      <TrendingDown className="size-3.5" />
                      <span>Gasto</span>
                    </button>
                  </div>

                  <input
                    type="number"
                    min={1}
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value) || 0)}
                    placeholder="Monto"
                    className="w-32 rounded-xl border border-line bg-white px-3 py-1.5 text-[13px] font-bold text-ink text-right focus:outline-none focus:border-purple-600"
                  />
                  <select
                    value={txCurrency}
                    onChange={(e) => setTxCurrency(e.target.value)}
                    className="rounded-xl border border-line bg-white px-2 py-1.5 text-[12px] font-bold text-ink"
                  >
                    <option value="$">$ (ARS/LOC)</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={txConcept}
                    onChange={(e) => setTxConcept(e.target.value)}
                    placeholder="Concepto (ej. Cobro de honorarios, Pago de materiales, Impresión)..."
                    className="flex-1 rounded-xl border border-line bg-white px-3 py-1.5 text-[13px] text-ink placeholder:text-ink-4 focus:outline-none focus:border-purple-600"
                  />
                  <button
                    type="submit"
                    disabled={!txConcept.trim() || txAmount <= 0}
                    className="rounded-xl bg-[#111318] text-white px-4 py-1.5 text-[12px] font-bold hover:bg-black disabled:opacity-40 shrink-0"
                  >
                    + Registrar
                  </button>
                </div>
              </form>

              {/* Transactions list */}
              <div className="flex flex-col gap-2 mt-1">
                {transactions.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-line rounded-2xl text-[13px] text-ink-3">
                    No hay movimientos financieros registrados en esta tarea.
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-line shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {tx.type === 'income' ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-ink">{tx.concept}</span>
                          <span className="text-[10px] text-ink-3">{tx.date} · {tx.type === 'income' ? 'Ingreso registrado' : 'Gasto registrado'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[14px] font-black tabular-nums ${
                            tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}{tx.currency}{tx.amount.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTaskMoneyTransaction(task.id, tx.id)}
                          className="text-ink-4 hover:text-red-500 p-1"
                          title="Eliminar movimiento"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CONTACTOS (CLIENTES, PROVEEDORES, PARTNERS) */}
          {activeTemplate === 'contacts' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-ink">Planilla de Contactos Táctica</h3>
                  <p className="text-[12px] text-ink-3">Gestioná nuevos clientes, proveedores y partners vinculados a esta tarea.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddContactForm((v) => !v)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#111318] text-white text-[12px] font-bold hover:bg-black transition-all shadow-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Nuevo contacto</span>
                </button>
              </div>

              {/* Add contact modal/form */}
              {showAddContactForm && (
                <form
                  onSubmit={handleAddContact}
                  className="flex flex-col gap-3 p-4 bg-gradient-to-b from-purple-50/50 to-white rounded-2xl border border-purple-200/80 shadow-sm animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                    <span className="text-[13px] font-bold text-purple-900">Ficha de Nuevo Contacto</span>
                    <button
                      type="button"
                      onClick={() => setShowAddContactForm(false)}
                      className="text-ink-3 hover:text-ink"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Category tabs */}
                  <div className="flex rounded-xl bg-subtle p-1 border border-line w-fit">
                    <button
                      type="button"
                      onClick={() => setContactCategory('client')}
                      className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all ${
                        contactCategory === 'client'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      🤝 Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactCategory('supplier')}
                      className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all ${
                        contactCategory === 'supplier'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      📦 Proveedor
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactCategory('partner')}
                      className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all ${
                        contactCategory === 'partner'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      🚀 Partner
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-ink-3">Nombre / Razón Social *</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Ej. Juan Pérez / Imprenta Central"
                        className="w-full mt-1 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-ink-3">Organización / Empresa</label>
                      <input
                        type="text"
                        value={contactOrg}
                        onChange={(e) => setContactOrg(e.target.value)}
                        placeholder="Ej. ACME Corp / Estudio Creativo"
                        className="w-full mt-1 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-ink-3">Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+54 9 11 1234-5678"
                        className="w-full mt-1 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-ink-3">Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contacto@ejemplo.com"
                        className="w-full mt-1 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-ink-3">Estado de relación</label>
                      <select
                        value={contactStatus}
                        onChange={(e) => setContactStatus(e.target.value)}
                        className="w-full mt-1 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-purple-600"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Prospecto">Prospecto</option>
                        <option value="En negociación">En negociación</option>
                        <option value="Cerrado">Cerrado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink-3">Notas tácticas / Acuerdos</label>
                    <textarea
                      rows={2}
                      value={contactNotes}
                      onChange={(e) => setContactNotes(e.target.value)}
                      placeholder="Condiciones de pago, cotizaciones, detalles de la reunión..."
                      className="w-full mt-1 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-purple-600 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddContactForm(false)}
                      className="px-3 py-1.5 rounded-xl border border-line text-[12px] font-semibold text-ink-3 hover:bg-subtle"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!contactName.trim()}
                      className="px-4 py-1.5 rounded-xl bg-purple-700 text-white text-[12px] font-bold hover:bg-purple-800 disabled:opacity-40 shadow-xs"
                    >
                      Guardar Contacto
                    </button>
                  </div>
                </form>
              )}

              {/* Contacts cards list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {(task.contacts || []).length === 0 ? (
                  <div className="sm:col-span-2 p-6 text-center border border-dashed border-line rounded-2xl text-[13px] text-ink-3">
                    No hay clientes, proveedores o partners asociados a esta tarea todavía.
                  </div>
                ) : (
                  task.contacts?.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col justify-between p-3.5 bg-white rounded-2xl border border-line shadow-xs hover:border-line-strong transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-black text-ink">{c.name}</span>
                            {c.organization && (
                              <span className="text-[11px] font-medium text-ink-3 flex items-center gap-1 mt-0.5">
                                <Building className="size-3" />
                                <span>{c.organization}</span>
                              </span>
                            )}
                          </div>

                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              c.category === 'client'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : c.category === 'supplier'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {c.category === 'client' ? 'Cliente' : c.category === 'supplier' ? 'Proveedor' : 'Partner'}
                          </span>
                        </div>

                        {c.notes && (
                          <p className="mt-2 text-[12px] text-ink-2 bg-subtle/50 p-2 rounded-lg line-clamp-2">
                            {c.notes}
                          </p>
                        )}
                      </div>

                      {/* Direct contact action buttons */}
                      <div className="flex items-center justify-between border-t border-line/50 pt-2.5 mt-3">
                        <div className="flex items-center gap-1.5">
                          {c.phone && (
                            <a
                              href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              <Phone className="size-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-ink-2 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors"
                            >
                              <Mail className="size-3" />
                              <span>Email</span>
                            </a>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeTaskContact(task.id, c.id)}
                          className="text-ink-4 hover:text-red-500 p-1"
                          title="Eliminar contacto"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: TRABAJO REALIZADO & ENTREGABLES */}
          {activeTemplate === 'workDone' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-[14px] font-bold text-ink">Bitácora de Trabajo Realizado & Entregables</h3>
                <p className="text-[12px] text-ink-3">Asentá lo efectivamente producido, informes, archivos o enlaces finales de entrega.</p>
              </div>

              {/* Form to add work log */}
              <form onSubmit={handleAddWorkLog} className="flex flex-col gap-2 p-3.5 bg-subtle/70 rounded-2xl border border-line">
                <textarea
                  rows={2}
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                  placeholder="Descripción del trabajo producido o finalizado en esta sesión..."
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-ink placeholder:text-ink-4 focus:outline-none focus:border-purple-600 resize-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={workDeliverableUrl}
                    onChange={(e) => setWorkDeliverableUrl(e.target.value)}
                    placeholder="Enlace al entregable (Drive, GitHub, Figma, Dropbox)..."
                    className="flex-1 rounded-xl border border-line bg-white px-3 py-1.5 text-[12.5px] text-ink placeholder:text-ink-4 focus:outline-none focus:border-purple-600"
                  />
                  <button
                    type="submit"
                    disabled={!workSummary.trim()}
                    className="rounded-xl bg-[#111318] text-white px-4 py-1.5 text-[12px] font-bold hover:bg-black disabled:opacity-40 shrink-0"
                  >
                    + Asentar Entrega
                  </button>
                </div>
              </form>

              {/* Work logs list */}
              <div className="flex flex-col gap-2.5 mt-1">
                {(task.workLogs || []).length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-line rounded-2xl text-[13px] text-ink-3">
                    Aún no hay entregables o registros de trabajo asentados.
                  </div>
                ) : (
                  task.workLogs?.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col gap-1.5 p-3.5 bg-white rounded-2xl border border-line shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium text-ink leading-relaxed whitespace-pre-wrap">
                          {log.summary}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeTaskWorkLog(task.id, log.id)}
                          className="text-ink-4 hover:text-red-500 p-1 shrink-0"
                          title="Eliminar registro"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-ink-3 pt-1 border-t border-line/40">
                        <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                        {log.deliverableUrl && (
                          <a
                            href={log.deliverableUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-purple-700 hover:underline font-semibold"
                          >
                            <span>Ver entregable</span>
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: MAPA DE PENSAMIENTOS (MIND MAP) */}
          {activeTemplate === 'mindmap' && (
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-[14px] font-bold text-ink">Mapa de Pensamientos & Lluvia Táctica</h3>
                <p className="text-[12px] text-ink-3">Ramificá conceptos, descubrimientos, ideas satélite e hipótesis sobre esta tarea.</p>
              </div>

              <MindMapCanvas
                map={task.thoughtMap}
                defaultTitle={task.title}
                onChange={handleThoughtMapChange}
                accentColor={projectColor}
              />
            </div>
          )}
            </>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-slate-50 border-t border-line shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-ink-3">{t('taskView.footer')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#111318] text-white text-[12.5px] font-bold hover:bg-black transition-all shadow-xs"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
