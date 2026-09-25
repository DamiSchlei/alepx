import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${className || ''}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line/60 pb-3 mb-2">
          <h3 className="text-[17px] font-bold text-ink leading-tight truncate">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close', 'Cerrar')}
            className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-subtle hover:text-ink active:scale-95 transition-all"
          >
            <X className="size-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
