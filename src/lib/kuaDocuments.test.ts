import { describe, expect, it } from 'vitest'
import { KUA_DOCS, docProgress, docsFor, registrationDeadline, toStatusMap } from './kuaDocuments'

describe('berkas KUA', () => {
  it('kunci dokumen unik dan sesuai format kolom doc_key', () => {
    const keys = KUA_DOCS.map((d) => d.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const k of keys) expect(k).toMatch(/^[a-z0-9_]{1,60}$/)
  })

  it('izin poligami hanya untuk CPP, taukil wali hanya untuk CPW', () => {
    expect(docsFor('cpp').some((d) => d.key === 'izin_poligami')).toBe(true)
    expect(docsFor('cpw').some((d) => d.key === 'izin_poligami')).toBe(false)
    expect(docsFor('cpw').some((d) => d.key === 'taukil_wali')).toBe(true)
    expect(docsFor('cpp').some((d) => d.key === 'taukil_wali')).toBe(false)
  })

  it('progres hanya menghitung dokumen yang berlaku', () => {
    const empty = docProgress('cpp', toStatusMap([]))
    // 7 wajib + 1 umum (pas foto); kondisional tidak dihitung sebelum ditandai berlaku
    expect(empty).toEqual({ done: 0, total: 8 })

    const map = toStatusMap([
      { doc_key: 'ktp', side: 'cpp', status: 'done' },
      { doc_key: 'pas_foto', side: 'cpp', status: 'na' },
      { doc_key: 'izin_ortu', side: 'cpp', status: 'todo' },
      { doc_key: 'akta_cerai', side: 'cpp', status: 'done' },
      { doc_key: 'kk', side: 'cpw', status: 'done' },
    ])
    expect(docProgress('cpp', map)).toEqual({ done: 2, total: 9 })
    expect(docProgress('cpw', map)).toEqual({ done: 1, total: 8 })
  })

  it('batas daftar = 10 hari kerja sebelum akad (Sabtu/Minggu dilewati)', () => {
    // Akad Sabtu 28 Nov 2026 → mundur 10 hari kerja = Senin 16 Nov 2026
    const d = registrationDeadline(new Date(2026, 10, 28))
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 16])
    // Akad Senin 7 Des 2026 → Senin 23 Nov 2026
    const e = registrationDeadline(new Date(2026, 11, 7))
    expect([e.getMonth(), e.getDate()]).toEqual([10, 23])
  })
})
