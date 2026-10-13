import { describe, expect, it } from 'vitest'
import { linkLabel, linkPreview, normalizeLink } from './links'

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

describe('linkPreview', () => {
  it('membaca nama produk Shopee dari alamatnya', () => {
    expect(linkPreview('https://shopee.co.id/Set-Alat-Sholat-Seserahan-Sage-i.123456.7890123')).toEqual({
      store: 'Shopee',
      title: 'Set Alat Sholat Seserahan Sage',
      shop: null,
      isSearch: false,
    })
  })

  it('Tokopedia: segmen pertama adalah nama toko', () => {
    const p = linkPreview('https://www.tokopedia.com/batikdanarhadi/kemeja-batik-sutra-pria')
    expect(p.store).toBe('Tokopedia')
    expect(p.title).toBe('Kemeja batik sutra pria')
    expect(p.shop).toBe('batikdanarhadi')
  })

  it('link pencarian menampilkan kata kuncinya', () => {
    const p = linkPreview('https://shopee.co.id/search?keyword=set%20seserahan')
    expect(p).toMatchObject({ title: 'set seserahan', isSearch: true })
  })

  it('link pendek tanpa nama produk → title null', () => {
    expect(linkPreview('https://id.shp.ee/AbC12xY').title).toBeNull()
    expect(linkPreview('https://id.shp.ee/AbC12xY').store).toBe('Shopee')
  })
})
