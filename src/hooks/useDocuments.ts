import { useCallback, useEffect, useRef, useState } from 'react'
import { db } from '@/lib/supabase'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { getDemoDocuments, saveDemoDocuments } from '@/lib/demoStore'
import type { DocumentSide, DocumentStatus, WeddingDocument } from '@/lib/database.types'

type Load<T> = { status: 'loading' } | { status: 'error'; missingTable: boolean } | { status: 'ready'; data: T }

/**
 * Status berkas KUA di workspace. Perubahan langsung tampil (optimistis);
 * bila gagal disimpan, data dimuat ulang dan error dilempar ke pemanggil.
 */
export function useDocuments(weddingId: string) {
  const [state, setState] = useState<Load<WeddingDocument[]>>({ status: 'loading' })
  // Salinan data terbaru untuk menghitung perubahan tanpa efek samping di dalam updater setState.
  const rows = useRef<WeddingDocument[]>([])
  const ready = (data: WeddingDocument[]) => {
    rows.current = data
    setState({ status: 'ready', data })
  }

  const load = useCallback(async () => {
    const demo = getCurrentDemoAccount()
    if (demo) {
      ready(getDemoDocuments(demo.id))
      return
    }
    const { data, error } = await db().from('wedding_documents').select('*').eq('wedding_id', weddingId)
    // 42P01 / PGRST205 = tabel belum ada (migration 000008 belum dijalankan)
    if (error) return setState({ status: 'error', missingTable: error.code === '42P01' || error.code === 'PGRST205' })
    ready(data ?? [])
  }, [weddingId])

  useEffect(() => {
    void load()
  }, [load])

  /** status null = hapus baris (kembali ke bawaan: belum siap / tidak berlaku). */
  const setStatus = useCallback(
    async (docKey: string, side: DocumentSide, status: DocumentStatus | null) => {
      const rest = rows.current.filter((r) => !(r.doc_key === docKey && r.side === side))
      const snapshot: WeddingDocument[] = status
        ? [...rest, { wedding_id: weddingId, doc_key: docKey, side, status, note: null, updated_by: null, updated_at: new Date().toISOString() }]
        : rest
      ready(snapshot)

      const demo = getCurrentDemoAccount()
      if (demo) {
        saveDemoDocuments(demo.id, snapshot)
        return
      }
      const query = status
        ? db().from('wedding_documents').upsert({ wedding_id: weddingId, doc_key: docKey, side, status }, { onConflict: 'wedding_id,doc_key,side' })
        : db().from('wedding_documents').delete().eq('wedding_id', weddingId).eq('doc_key', docKey).eq('side', side)
      const { error } = await query
      if (error) {
        void load()
        throw new Error('Perubahan gagal disimpan. Periksa koneksi lalu coba lagi.')
      }
    },
    [weddingId, load],
  )

  return { state, reload: load, setStatus }
}
