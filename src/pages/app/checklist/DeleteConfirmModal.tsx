import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { ChecklistItem } from '@/lib/checklistTypes'

type DeleteConfirmModalProps = {
  isOpen: boolean
  task: ChecklistItem | null
  onClose: () => void
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function DeleteConfirmModal({ isOpen, task, onClose, onConfirm, isDeleting }: DeleteConfirmModalProps) {
  if (!isOpen || !task) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-pop p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <AlertTriangle className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-ink">Hapus Tugas Ini?</h3>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Kamu yakin ingin menghapus tugas <strong className="text-ink">"{task.title}"</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Batal
          </Button>
          <Button variant="danger" loading={isDeleting} onClick={onConfirm}>
            Ya, Hapus
          </Button>
        </div>
      </div>
    </div>
  )
}
