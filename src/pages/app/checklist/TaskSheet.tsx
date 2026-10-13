import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FieldShell, TextField, inputClass } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { CHECKLIST_EVENTS, type ChecklistEventKey, type ChecklistItem } from '@/lib/checklistTypes'

const EVENT_KEYS = Object.keys(CHECKLIST_EVENTS) as ChecklistEventKey[]

export type TaskDraft = { title: string; due_date: string | null; notes: string | null; event: ChecklistEventKey }

/**
 * Lembar bawah sederhana untuk satu tugas: nama, tanggal target, catatan, dan acara.
 * Rincian administratif (biaya, jumlah, toko) sengaja tidak ditampilkan; belanja dicatat di Anggaran.
 */
export function TaskSheet({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: ChecklistItem
  onClose: () => void
  onSave: (draft: TaskDraft) => Promise<void>
  onDelete: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [due, setDue] = useState(task.due_date ?? '')
  const [notes, setNotes] = useState(task.notes ?? '')
  const [event, setEvent] = useState<ChecklistEventKey>((task.event as ChecklistEventKey) || 'pernikahan')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const titleId = useId()
  const notesId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Nama tugas tidak boleh kosong.')
      return
    }
    setBusy(true)
    try {
      await onSave({ title: title.trim(), due_date: due || null, notes: notes.trim() || null, event })
      onClose()
    } catch {
      setError('Gagal menyimpan. Periksa koneksi lalu coba lagi.')
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        noValidate
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet-up safe-bottom max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface shadow-pop sm:animate-fade-up sm:rounded-3xl"
      >
        <div className="sticky top-0 flex items-center justify-between bg-surface px-5 pb-2 pt-3">
          <span aria-hidden className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-border sm:hidden" />
          <h2 id={titleId} className="pt-2 font-display text-xl font-semibold text-ink">
            Detail tugas
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="mt-1 flex size-10 cursor-pointer items-center justify-center rounded-xl text-ink-subtle hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-5">
          <TextField label="Tugas" value={title} onChange={(e) => setTitle(e.target.value)} error={error ?? undefined} maxLength={160} />

          <TextField label="Target selesai" optional type="date" value={due} onChange={(e) => setDue(e.target.value)} />

          <FieldShell id={notesId} label="Catatan" optional>
            <textarea
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Contoh: tanya Bu RT soal surat pengantar"
              className={cn(inputClass, 'h-auto py-2.5')}
            />
          </FieldShell>

          <fieldset>
            <legend className="text-sm font-semibold text-ink">Bagian</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {EVENT_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={event === key}
                  onClick={() => setEvent(key)}
                  className={cn(
                    'min-h-9 cursor-pointer rounded-full border px-3 text-sm font-medium transition-colors',
                    event === key ? 'border-primary bg-primary-soft text-primary' : 'border-border text-ink-muted hover:border-border-strong hover:text-ink',
                  )}
                >
                  {CHECKLIST_EVENTS[key].shortTitle}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-2 pt-1">
            <Button variant="ghost" onClick={onDelete} icon={<Trash2 className="size-4" aria-hidden />} className="mr-auto px-3! hover:bg-danger-soft hover:text-danger">
              Hapus
            </Button>
            <Button type="submit" loading={busy}>
              Simpan
            </Button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  )
}
