import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/primitives'
import { deleteProject } from '@/data/actions'
import type { Project } from '@/domain/types'

interface DeleteProjectModalProps {
  open: boolean
  onClose: () => void
  project: Project
  onDeleted?: (id: string) => void
}

export function DeleteProjectModal({
  open,
  onClose,
  project,
  onDeleted,
}: DeleteProjectModalProps) {
  const { t } = useTranslation()

  const handleConfirm = () => {
    deleteProject(project.id, true)
    onDeleted?.(project.id)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar proyecto"
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-950 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
            <Trash2 className="size-5" />
          </div>
          <div>
            <h4 className="text-[14px] font-bold">
              ¿Eliminar "{project.name}"?
            </h4>
            <p className="mt-1 text-[13px] opacity-90 leading-relaxed">
              Esta acción eliminará el proyecto y limpiará sus resultados y tareas asociadas.
              Es ideal para archivar o descartar frentes de trabajo inactivos y mantener tu espacio de creación con total claridad.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-full bg-red-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-red-700 active:scale-95 transition-all shadow-xs"
          >
            Sí, eliminar proyecto
          </button>
        </div>
      </div>
    </Modal>
  )
}
