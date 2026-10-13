import { describe, expect, it } from 'vitest'
import { linkLabel, normalizeLink } from './links'

describe('normalizeLink', () => {
  it('kosong berarti tanpa link', () => {
    expect(normalizeLink('  ')).toEqual({ ok: true, url: null })
  })

  it('menambahkan https jika pengguna menempel tanpa skema', () => {
    expect(normalizeLink('shopee.co.id/produk-123')).toEqual({ ok: true, url: 'https://shopee.co.id/produk-123' })
  })

  it('menolak skema selain http(s) dan teks yang bukan alamat web', () => {
    expect(normalizeLink('javascript:alert(1)').ok).toBe(false)
    expect(normalizeLink('beli di pasar').ok).toBe(false)
  })
})

describe('linkLabel', () => {
  it('menampilkan nama marketplace yang dikenal', () => {
    expect(linkLabel('https://www.shopee.co.id/abc')).toBe('Shopee')
    expect(linkLabel('https://tokopedia.com/toko/x')).toBe('Tokopedia')
  })

  it('domain lain ditampilkan apa adanya tanpa www', () => {
    expect(linkLabel('https://www.toko-kue.com/a')).toBe('toko-kue.com')
  })
})
