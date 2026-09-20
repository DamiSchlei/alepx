import { useState, useMemo } from 'react'
import {
  CheckCircle2,
  Clock,
  Coins,
  BarChart3,
  Users,
  FileCheck2,
  BrainCircuit,
  Plus,
  Phone,
  Mail,
  Building,
  ArrowRight,
} from 'lucide-react'
import { useFocusSession } from '@/data/focusSession'
import { blockContext } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { TERRENO_MAP } from '@/domain/terrenos'
import type { Task, TaskContact } from '@/domain/types'

interface DayTacticalDashboardProps {
  tasks: Task[]
  dayKey: string
  onOpenTacticalModal: (taskId: string) => void
  onQuickAddTask: () => void
}

type ContactFilter = 'all' | 'client' | 'supplier' | 'partner'

export function DayTacticalDashboard({
  tasks,
  dayKey,
  onOpenTacticalModal,
  onQuickAddTask,
}: DayTacticalDashboardProps) {
  const state = useAleph()
  const focusSession = useFocusSession()

  const [contactFilter, setContactFilter] = useState<ContactFilter>('all')

  // Production and Tactical aggregated metrics
  const {
    totalActualHours,
    totalEstimatedHours,
    totalIncome,
    totalExpense,
    totalChecklistItems,
    doneChecklistItems,
    allContacts,
    allMetricsCount,
    allWorkLogsCount,
    allMindMapsCount,
  } = useMemo(() => {
    let actualH = 0
    let estH = 0
    let inc = 0
    let exp = 0
    let totalCheck = 0
    let doneCheck = 0
    let metricsCount = 0
    let workLogsCount = 0
    let mindMapsCount = 0
    const contactsMap = new Map<string, { contact: TaskContact; taskTitle: string }>()

    for (const task of tasks) {
      actualH += task.actualHours ?? 0
      estH += task.estimatedHours ?? 0

      if (task.checklist) {
        totalCheck += task.checklist.length
        doneCheck += task.checklist.filter((c) => c.done).length
      }

      if (task.moneyTransactions) {
        for (const tx of task.moneyTransactions) {
          if (tx.type === 'income') inc += tx.amount
          if (tx.type === 'expense') exp += tx.amount
        }
      }

      if (task.metrics) {
        metricsCount += task.metrics.length
      }

      if (task.workLogs) {
        workLogsCount += task.workLogs.length
      }

      if (task.thoughtMap?.nodes && task.thoughtMap.nodes.length > 0) {
        mindMapsCount += 1
      }

      if (task.contacts) {
        for (const c of task.contacts) {
          if (!contactsMap.has(c.id)) {
            contactsMap.set(c.id, { contact: c, taskTitle: task.title })
          }
        }
      }
    }

    return {
      totalActualHours: actualH,
      totalEstimatedHours: estH,
      totalIncome: inc,
      totalExpense: exp,
      totalChecklistItems: totalCheck,
      doneChecklistItems: doneCheck,
      allContacts: Array.from(contactsMap.values()),
      allMetricsCount: metricsCount,
      allWorkLogsCount: workLogsCount,
      allMindMapsCount: mindMapsCount,
    }
  }, [tasks])

  const netBalance = totalIncome - totalExpense

  const filteredContacts = useMemo(() => {
    if (contactFilter === 'all') return allContacts
    return allContacts.filter((item) => item.contact.category === contactFilter)
  }, [allContacts, contactFilter])

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 sm:p-6 pb-24">
      {/* 1. Header Hero Panel: Visión y Producción de la Planificación */}
      <div className="flex flex-col gap-4 p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl shadow-xl border border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">
              Centro Táctico & Operativo · {dayKey}
            </span>
            <h2 className="text-[20px] sm:text-[24px] font-black tracking-tight mt-0.5">
              Producción de la Planificación
            </h2>
            <p className="text-[13px] text-slate-300 mt-1 max-w-xl">
              Las tareas como soporte de toda la táctica: variables, dinero, horas reales, planillas de clientes/proveedores/partners y mapas de pensamiento.
            </p>
          </div>

          <button
            type="button"
            onClick={onQuickAddTask}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-bold text-[13px] hover:bg-slate-100 active:scale-95 transition-all shadow-md shrink-0"
          >
            <Plus className="size-4" />
            <span>+ Nueva Tarea Táctica</span>
          </button>
        </div>

        {/* Tactical Key Metrics Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-2 border-t border-slate-700/60">
          {/* Tiempo Medido */}
          <div className="flex flex-col p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="size-3.5 text-purple-400" />
              <span>Tiempo Real</span>
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[18px] sm:text-[20px] font-black text-white tabular-nums">
                {Math.round(totalActualHours * 60)}
              </span>
              <span className="text-[11px] font-medium text-slate-400">min / {totalEstimatedHours}h est.</span>
            </div>
          </div>

          {/* Balance Financiero */}
          <div className="flex flex-col p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Coins className="size-3.5 text-amber-400" />
              <span>Balance Neto</span>
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-[18px] sm:text-[20px] font-black tabular-nums ${
                  netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {netBalance >= 0 ? `+$${netBalance.toLocaleString()}` : `-$${Math.abs(netBalance).toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Checklists y Pasos */}
          <div className="flex flex-col p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span>Checklist Global</span>
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[18px] sm:text-[20px] font-black text-white tabular-nums">
                {doneChecklistItems}/{totalChecklistItems}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                ({totalChecklistItems > 0 ? Math.round((doneChecklistItems / totalChecklistItems) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Contactos Involucrados */}
          <div className="flex flex-col p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Users className="size-3.5 text-blue-400" />
              <span>Contactos</span>
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[18px] sm:text-[20px] font-black text-white tabular-nums">
                {allContacts.length}
              </span>
              <span className="text-[11px] font-medium text-slate-400">fichas</span>
            </div>
          </div>
        </div>

        {/* Secondary Tactical Production Counters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/40 text-[11.5px] text-slate-300">
          <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            <BarChart3 className="size-3.5 text-amber-400" />
            <strong className="text-white">{allMetricsCount}</strong> variables registradas
          </span>
          <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            <FileCheck2 className="size-3.5 text-blue-400" />
            <strong className="text-white">{allWorkLogsCount}</strong> entregables documentados
          </span>
          <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            <BrainCircuit className="size-3.5 text-purple-400" />
            <strong className="text-white">{allMindMapsCount}</strong> mapas de pensamiento activos
          </span>
        </div>
      </div>

      {/* 2. Tactical Tasks Production List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-black text-ink">Tareas & Unidades Tácticas del Día</h3>
            <p className="text-[12px] text-ink-3">
              Hacé clic en cualquier tarea para abrir su estudio táctico completo.
            </p>
          </div>
          <span className="text-[12px] font-bold text-ink-3 bg-subtle px-2.5 py-1 rounded-full">
            {tasks.length} tareas asignadas
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-line text-ink-3">
            <p className="text-[14px] font-semibold">No hay tareas tácticas programadas para este día.</p>
            <p className="text-[12px] text-ink-4 mt-1">Anotá una nueva tarea para comenzar la producción.</p>
            <button
              type="button"
              onClick={onQuickAddTask}
              className="mt-3 px-4 py-2 rounded-xl bg-[#111318] text-white text-[12px] font-bold hover:bg-black"
            >
              + Sumar tarea
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tasks.map((task) => {
              const ctx = blockContext(state, task)
              const done = isTaskDone(task.status)
              const isExecuting = focusSession.activeTaskId === task.id
              const color = ctx.projectColor || ctx.color || '#7a3fe0'
              const terrenoInfo = TERRENO_MAP[ctx.terreno ?? 'literatura']

              const checklist = task.checklist || []
              const doneItems = checklist.filter((c) => c.done).length

              const transactions = task.moneyTransactions || []
              const inc = transactions
                .filter((t) => t.type === 'income')
                .reduce((acc, t) => acc + t.amount, 0)
              const exp = transactions
                .filter((t) => t.type === 'expense')
                .reduce((acc, t) => acc + t.amount, 0)
              const net = inc - exp

              return (
                <div
                  key={task.id}
                  onClick={() => onOpenTacticalModal(task.id)}
                  className={`group flex flex-col gap-3 p-4 bg-white rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:border-purple-300 ${
                    isExecuting
                      ? 'border-amber-400 ring-2 ring-amber-300/60 bg-amber-50/20'
                      : done
                      ? 'border-line/70 bg-slate-50/50 opacity-90'
                      : 'border-line'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span
                        className="size-3 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-wider truncate">
                            {ctx.project?.name ?? ctx.result?.name ?? 'Tarea'}
                          </span>
                          <span
                            className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full"
                            style={{
                              backgroundColor: `${terrenoInfo.color}15`,
                              color: terrenoInfo.color,
                            }}
                          >
                            {terrenoInfo.label}
                          </span>
                          {isExecuting && (
                            <span className="text-[9.5px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full animate-pulse">
                              EN CURSO
                            </span>
                          )}
                        </div>

                        <h4 className={`text-[15px] font-bold text-ink leading-snug mt-0.5 ${done ? 'line-through text-ink-3' : ''}`}>
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenTacticalModal(task.id)
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-subtle hover:bg-purple-50 text-[11.5px] font-bold text-ink hover:text-purple-700 transition-colors border border-line"
                      >
                        <span>Abrir Táctica</span>
                        <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>

                  {/* Tactical Indicators Ribbons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60 text-[11px] font-semibold text-ink-2">
                    {/* Time */}
                    <span className="flex items-center gap-1 bg-subtle/80 px-2 py-0.8 rounded-lg">
                      <Clock className="size-3.5 text-purple-600" />
                      <span>{Math.round((task.actualHours ?? 0) * 60)}m dedicados / {task.estimatedHours}h est.</span>
                    </span>

                    {/* Checklist */}
                    {checklist.length > 0 && (
                      <span className="flex items-center gap-1 bg-subtle/80 px-2 py-0.8 rounded-lg">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span>{doneItems}/{checklist.length} pasos</span>
                      </span>
                    )}

                    {/* Finance */}
                    {transactions.length > 0 && (
                      <span
                        className={`flex items-center gap-1 px-2 py-0.8 rounded-lg font-bold ${
                          net >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        <Coins className="size-3.5" />
                        <span>Neto: {net >= 0 ? `+$${net.toLocaleString()}` : `-$${Math.abs(net).toLocaleString()}`}</span>
                      </span>
                    )}

                    {/* Contacts */}
                    {(task.contacts?.length ?? 0) > 0 && (
                      <span className="flex items-center gap-1 bg-subtle/80 px-2 py-0.8 rounded-lg text-indigo-700">
                        <Users className="size-3.5" />
                        <span>{task.contacts?.length} contactos</span>
                      </span>
                    )}

                    {/* Metrics */}
                    {(task.metrics?.length ?? 0) > 0 && (
                      <span className="flex items-center gap-1 bg-subtle/80 px-2 py-0.8 rounded-lg text-amber-700">
                        <BarChart3 className="size-3.5" />
                        <span>{task.metrics?.length} variables</span>
                      </span>
                    )}

                    {/* Mind Map */}
                    {Boolean(task.thoughtMap?.nodes?.length) && (
                      <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.8 rounded-lg">
                        <BrainCircuit className="size-3.5" />
                        <span>{task.thoughtMap?.nodes?.length} ideas en mapa</span>
                      </span>
                    )}

                    {/* Work Logs */}
                    {(task.workLogs?.length ?? 0) > 0 && (
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.8 rounded-lg">
                        <FileCheck2 className="size-3.5" />
                        <span>{task.workLogs?.length} entregables</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Consolidated Contact Sheet (Planilla de Clientes, Proveedores, Partners) */}
      <div className="flex flex-col gap-3 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-[16px] font-black text-ink">
              Planilla de Contactos (Clientes, Proveedores, Partners)
            </h3>
            <p className="text-[12px] text-ink-3">
              Directorio de personas y organizaciones involucradas en las tareas de este día.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex rounded-xl bg-subtle p-0.5 border border-line w-fit">
            <button
              type="button"
              onClick={() => setContactFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                contactFilter === 'all' ? 'bg-white shadow-xs text-ink' : 'text-ink-3 hover:text-ink'
              }`}
            >
              Todos ({allContacts.length})
            </button>
            <button
              type="button"
              onClick={() => setContactFilter('client')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                contactFilter === 'client' ? 'bg-blue-600 text-white shadow-xs' : 'text-ink-3 hover:text-ink'
              }`}
            >
              🤝 Clientes
            </button>
            <button
              type="button"
              onClick={() => setContactFilter('supplier')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                contactFilter === 'supplier' ? 'bg-amber-600 text-white shadow-xs' : 'text-ink-3 hover:text-ink'
              }`}
            >
              📦 Proveedores
            </button>
            <button
              type="button"
              onClick={() => setContactFilter('partner')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                contactFilter === 'partner' ? 'bg-purple-600 text-white shadow-xs' : 'text-ink-3 hover:text-ink'
              }`}
            >
              🚀 Partners
            </button>
          </div>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-line text-[13px] text-ink-3">
            No hay contactos de este tipo registrados en las tareas del día. Podés sumar contactos abriendo cualquier tarea táctica.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredContacts.map(({ contact: c, taskTitle }) => (
              <div
                key={c.id}
                className="flex flex-col justify-between p-3.5 bg-white rounded-2xl border border-line shadow-xs hover:border-line-strong transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex flex-col">
                      <span className="text-[13.5px] font-bold text-ink">{c.name}</span>
                      {c.organization && (
                        <span className="text-[11px] font-medium text-ink-3 flex items-center gap-1 mt-0.5">
                          <Building className="size-3" />
                          <span>{c.organization}</span>
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
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

                  <div className="text-[10.5px] text-ink-3 mt-1.5 truncate">
                    Tarea: <span className="font-semibold text-ink-2">{taskTitle}</span>
                  </div>

                  {c.notes && (
                    <p className="mt-2 text-[11px] text-ink-2 bg-subtle/50 p-1.5 rounded-lg line-clamp-2">
                      {c.notes}
                    </p>
                  )}
                </div>

                {/* Direct Action Links */}
                <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-line/40">
                  {c.phone && (
                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-0.8 rounded-lg text-[10.5px] font-bold transition-colors"
                    >
                      <Phone className="size-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-ink-2 px-2 py-0.8 rounded-lg text-[10.5px] font-medium transition-colors"
                    >
                      <Mail className="size-3" />
                      <span>Email</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
