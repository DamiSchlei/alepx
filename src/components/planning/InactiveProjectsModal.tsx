import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/primitives'
import { deleteProject } from '@/data/actions'
import type { ProjectStats } from '@/data/selectors'

interface InactiveProjectsModalProps {
  open: boolean
  onClose: () => void
  inactiveProjects: ProjectStats[]
  onSelectProjectToAdvance: (projectName: string) => void
  onCanProceedCreate: () => void
}

export function InactiveProjectsModal({
  open,
  onClose,
  inactiveProjects,
  onSelectProjectToAdvance,
  onCanProceedCreate,
}: InactiveProjectsModalProps) {
  const { t } = useTranslation()
  const [projectToDelete, setProjectToDelete] = useState<ProjectStats | null>(null)

  const canCreateNow = inactiveProjects.length < 3

  const handleDeleteConfirmed = () => {
    if (!projectToDelete) return
    deleteProject(projectToDelete.project.id, true)
    setProjectToDelete(null)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        canCreateNow
          ? '¡Espacio liberado para tu nuevo proyecto!'
          : 'Límite de proyectos sin avances (3 proyectos)'
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Pedagogical alert box */}
        <div
          className={`rounded-2xl border p-4 text-[13px] leading-relaxed transition-all ${
            canCreateNow
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-200'
              : 'border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {canCreateNow ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <ShieldAlert className="size-5 shrink-0 text-amber-600 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-[14px] mb-1">
                {canCreateNow
                  ? 'Tu espacio de trabajo está despejado'
                  : 'Para mantener el foco y evitar la dispersión'}
              </p>
              <p className="text-[13px] opacity-90">
                {canCreateNow
                  ? 'Tenés menos de 3 proyectos inactivos. Podés crear tu nuevo proyecto con claridad mental.'
                  : 'El método propone no acumular más de 3 proyectos sin avances en simultáneo. Para crear uno nuevo, eliminá los proyectos que ya no correspondan a tu presente o avanzá tareas en alguno existente.'}
              </p>
            </div>
          </div>
        </div>

        {/* List of projects without advances */}
        <div>
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-ink-3 mb-2">
            Proyectos sin avances registrados ({inactiveProjects.length}):
          </h4>
          <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
            {inactiveProjects.map((stat) => {
              const p = stat.project
              const color = p.color || '#7a3fe0'
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface/40 p-3 hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="size-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-ink truncate">{p.name}</p>
                      <p className="text-[11px] text-ink-3 truncate">
                        {p.description || 'Sin descripción'} · {stat.totalTasks} tareas (0 completadas)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProjectToAdvance(p.name)
                        onClose()
                      }}
                      className="flex items-center gap-1 rounded-lg border border-line/80 bg-white px-2.5 py-1 text-[11px] font-medium text-ink-2 hover:border-accent hover:text-accent active:scale-95 transition-all"
                      title="Abrir proyecto y registrar avances"
                    >
                      <span>Avanzar</span>
                      <ArrowRight className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectToDelete(stat)}
                      className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 hover:text-red-700 active:scale-95 transition-all"
                      title="Eliminar este proyecto inactivo"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Borrar</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Delete confirmation sub-card */}
        {projectToDelete && (
          <div className="rounded-xl border border-red-300 bg-red-50/90 p-3.5 text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200 animate-in fade-in zoom-in-95">
            <p className="text-[13px] font-bold">
              ¿Eliminar definitivamente el proyecto "{projectToDelete.project.name}"?
            </p>
            <p className="mt-1 text-[11px] text-red-800 dark:text-red-300">
              Se eliminarán también sus resultados y tareas asociadas para dejar tu espacio limpio.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setProjectToDelete(null)}
              >
                {t('common.cancel', 'Cancelar')}
              </Button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-red-700 active:scale-95 transition-all shadow-xs"
              >
                Sí, eliminar proyecto
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-line/60 pt-3 mt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          {canCreateNow ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                onCanProceedCreate()
              }}
              className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-bold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <Sparkles className="size-4" />
              <span>Continuar y crear nuevo proyecto</span>
            </button>
          ) : (
            <p className="text-[11px] text-ink-3 italic">
              Eliminá al menos 1 proyecto para habilitar la creación
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
