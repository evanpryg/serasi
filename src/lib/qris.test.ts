import { describe, expect, it } from 'vitest'
import { crc16, isValidQris, merchantName, parseTlv, withAmount } from './qris'

// QRIS statis dari stiker merchant (dibaca dari gambar, CRC asli 10FD).
const STATIC =
  '00020101021126600016ID.CO.SHOPEE.WWW0118936009180001387499020713874990303UMI51440014ID.CO.QRIS.WWW0215ID10210817576970303UMI5204539953033605802ID5909Starlight6006JEMBER61056816762070703A01630410FD'

describe('qris', () => {
  it('menghitung CRC yang sama dengan stiker asli', () => {
    expect(crc16(STATIC.slice(0, -4))).toBe('10FD')
    expect(isValidQris(STATIC)).toBe(true)
  })

  it('menolak payload yang diubah tanpa menghitung ulang CRC', () => {
    expect(isValidQris(STATIC.replace('Starlight', 'Starlite!'))).toBe(false)
  })

  it('membaca nama merchant', () => {
    expect(merchantName(STATIC)).toBe('Starlight')
  })

  it('membuat QR dinamis dengan nominal dan CRC yang valid', () => {
    const dyn = withAmount(STATIC, 98763)
    expect(isValidQris(dyn)).toBe(true)
    const tags = parseTlv(dyn)
    expect(tags.find((t) => t.tag === '01')?.value).toBe('12')
    expect(tags.find((t) => t.tag === '54')?.value).toBe('98763')
    // urutan: 53 (IDR) lalu 54 (nominal) lalu 58 (negara)
    const order = tags.map((t) => t.tag)
    expect(order.indexOf('54')).toBe(order.indexOf('53') + 1)
    // data merchant tidak berubah
    expect(tags.find((t) => t.tag === '26')).toEqual(parseTlv(STATIC).find((t) => t.tag === '26'))
  })

  it('mengganti nominal lama, tidak menambah dua kali', () => {
    const twice = withAmount(withAmount(STATIC, 1000), 2500)
    expect(parseTlv(twice).filter((t) => t.tag === '54')).toEqual([{ tag: '54', value: '2500' }])
  })

  it('menolak nominal tidak valid', () => {
    expect(() => withAmount(STATIC, 0)).toThrow()
    expect(() => withAmount(STATIC, 10.5)).toThrow()
    expect(() => withAmount('bukan-qris', 1000)).toThrow()
  })
})
