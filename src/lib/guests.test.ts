import { describe, expect, it } from 'vitest'
import type { Guest } from './database.types'
import { normalizeCategory, normalizeGuest, tallyByCategory } from './guests'

const guest = (over: Partial<Guest>): Guest => ({
  id: crypto.randomUUID(),
  wedding_id: 'w',
  name: 'Tamu',
  group_name: 'Saudara',
  side: 'cpp',
  guest_count: 1,
  invitation_status: 'belum',
  rsvp_status: 'menunggu',
  notes: null,
  created_at: '',
  updated_at: '',
  ...over,
})

describe('normalizeCategory', () => {
  it('menyeragamkan nama kelompok lama', () => {
    expect(normalizeCategory('Keluarga Pria')).toBe('Saudara')
    expect(normalizeCategory('Sahabat & Teman')).toBe('Teman/Sahabat')
    expect(normalizeCategory('Kolega Kantor')).toBe('Rekan kerja')
    expect(normalizeCategory('VIP')).toBe('Tokoh/VIP')
    expect(normalizeCategory(null)).toBe('Lainnya')
    expect(normalizeCategory('Jamaah Masjid')).toBe('Jamaah Masjid')
  })
})

describe('normalizeGuest', () => {
  it('menebak pihak dari nama kelompok jika kolom side belum ada', () => {
    const legacy = { ...guest({ group_name: 'Keluarga Wanita' }), side: undefined } as unknown as Guest
    expect(normalizeGuest(legacy)).toMatchObject({ side: 'cpw', group_name: 'Saudara' })
  })
  it('memakai pihak yang tersimpan', () => {
    expect(normalizeGuest(guest({ side: 'cpw', group_name: 'Teman/Sahabat' })).side).toBe('cpw')
  })
})

describe('tallyByCategory', () => {
  it('menghitung undangan & orang per kategori per pihak', () => {
    const { rows, cpp, cpw, total } = tallyByCategory([
      guest({ side: 'cpp', group_name: 'Teman/Sahabat', guest_count: 2 }),
      guest({ side: 'cpp', group_name: 'Saudara', guest_count: 4 }),
      guest({ side: 'cpw', group_name: 'Saudara', guest_count: 3 }),
      guest({ side: 'cpw', group_name: 'Jamaah Masjid', guest_count: 1 }),
    ])
    expect(rows.map((r) => r.category)).toEqual(['Saudara', 'Teman/Sahabat', 'Jamaah Masjid'])
    expect(rows[0]).toMatchObject({ cpp: { invites: 1, people: 4 }, cpw: { invites: 1, people: 3 }, total: { invites: 2, people: 7 } })
    expect(cpp).toEqual({ invites: 2, people: 6 })
    expect(cpw).toEqual({ invites: 2, people: 4 })
    expect(total).toEqual({ invites: 4, people: 10 })
  })
})
