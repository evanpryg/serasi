import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDateShort,
  formatNumber,
  formatRupiah,
  formatRupiahShort,
  parseRupiahInput,
  relativeDueLabel,
  toDateOnly,
} from './format'
import { isSafeAppPath } from './config'

describe('rupiah', () => {
  it('format penuh dengan titik ribuan', () => {
    expect(formatRupiah(12_500_000)).toBe('Rp 12.500.000')
    expect(formatRupiah(0)).toBe('Rp 0')
  })
  it('format ringkas', () => {
    expect(formatRupiahShort(12_500_000)).toBe('Rp 12,5 jt')
    expect(formatRupiahShort(1_250_000_000)).toBe('Rp 1,3 M')
    expect(formatRupiahShort(750_000)).toBe('Rp 750 rb')
    expect(formatRupiahShort(-2_000_000)).toBe('-Rp 2 jt')
  })
  it('formatNumber', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })
  it('parse input pengguna menjadi integer', () => {
    expect(parseRupiahInput('12.500.000')).toBe(12_500_000)
    expect(parseRupiahInput('Rp 5.000')).toBe(5000)
    expect(parseRupiahInput('5.000,75')).toBe(5000)
    expect(parseRupiahInput('')).toBeNull()
    expect(parseRupiahInput('abc')).toBeNull()
    expect(parseRupiahInput('99999999999999999999')).toBeNull()
  })
})

describe('tanggal', () => {
  it('format Indonesia', () => {
    expect(formatDate('2026-10-13')).toBe('13 Oktober 2026')
    expect(formatDateShort('2026-08-01')).toBe('1 Agu 2026')
    expect(formatDate(null)).toBe('—')
  })
  it('toDateOnly memakai tanggal lokal', () => {
    expect(toDateOnly(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
  it('label tenggat relatif', () => {
    const today = new Date(2026, 9, 13)
    expect(relativeDueLabel('2026-10-13', today)).toBe('Hari ini')
    expect(relativeDueLabel('2026-10-14', today)).toBe('Besok')
    expect(relativeDueLabel('2026-10-20', today)).toBe('7 hari lagi')
    expect(relativeDueLabel('2026-10-11', today)).toBe('Terlambat 2 hari')
  })
})

describe('isSafeAppPath (cegah open redirect)', () => {
  it('menerima path aplikasi', () => {
    expect(isSafeAppPath('/app/budget')).toBe(true)
    expect(isSafeAppPath('/join/ABCD2345')).toBe(true)
  })
  it('menolak path berbahaya', () => {
    expect(isSafeAppPath('//evil.com')).toBe(false)
    expect(isSafeAppPath('https://evil.com/app/x')).toBe(false)
    expect(isSafeAppPath('/app/\\evil')).toBe(false)
    expect(isSafeAppPath('/login')).toBe(false)
    expect(isSafeAppPath('/join/../app')).toBe(false)
    expect(isSafeAppPath(null)).toBe(false)
  })
})
