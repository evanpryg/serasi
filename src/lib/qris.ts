/**
 * QRIS (standar EMVCo Merchant-Presented QR) — utilitas kecil tanpa dependensi.
 *
 * Stiker QRIS merchant berisi QR *statis* (tag 01 = "11"): pembayar mengetik nominal sendiri.
 * Untuk checkout kita membuat QR *dinamis* dari payload yang sama: tag 01 = "12", tambah
 * tag 54 (nominal), lalu hitung ulang CRC (tag 63). Nominal otomatis terisi di aplikasi
 * pembayar sehingga tidak ada salah ketik dan kode unik pasti terbayar persis.
 */

export type Tlv = { tag: string; value: string }

/** CRC16/CCITT-FALSE (poly 0x1021, awal 0xFFFF), 4 digit heksadesimal huruf besar. */
export function crc16(input: string): string {
  let crc = 0xffff
  for (const byte of new TextEncoder().encode(input)) {
    crc ^= byte << 8
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Pecah payload menjadi daftar tag-panjang-nilai tingkat atas. Melempar error jika rusak. */
export function parseTlv(payload: string): Tlv[] {
  const out: Tlv[] = []
  let i = 0
  while (i < payload.length) {
    const tag = payload.slice(i, i + 2)
    const len = Number(payload.slice(i + 2, i + 4))
    if (!/^\d{2}$/.test(tag) || !Number.isInteger(len) || i + 4 + len > payload.length) throw new Error('Payload QRIS rusak')
    out.push({ tag, value: payload.slice(i + 4, i + 4 + len) })
    i += 4 + len
  }
  return out
}

const encode = (tlvs: Tlv[]) => tlvs.map((t) => t.tag + String(t.value.length).padStart(2, '0') + t.value).join('')

/** true jika struktur TLV utuh dan CRC di akhir payload cocok. */
export function isValidQris(payload: string): boolean {
  try {
    const tlvs = parseTlv(payload)
    const last = tlvs.at(-1)
    return tlvs[0]?.tag === '00' && last?.tag === '63' && last.value === crc16(payload.slice(0, -4))
  } catch {
    return false
  }
}

/** Nama merchant (tag 59) yang akan tampil di aplikasi pembayar. */
export function merchantName(payload: string): string | null {
  try {
    return parseTlv(payload).find((t) => t.tag === '59')?.value ?? null
  } catch {
    return null
  }
}

/** Ubah QRIS statis menjadi dinamis dengan nominal rupiah bulat. */
export function withAmount(payload: string, amount: number): string {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Nominal tidak valid')
  if (!isValidQris(payload)) throw new Error('Payload QRIS tidak valid')

  const tlvs = parseTlv(payload).filter((t) => t.tag !== '63' && t.tag !== '54')
  const next: Tlv[] = []
  for (const t of tlvs) {
    next.push(t.tag === '01' ? { tag: '01', value: '12' } : t)
    // Nominal ditempatkan setelah mata uang (53), sesuai urutan tag EMVCo.
    if (t.tag === '53') next.push({ tag: '54', value: String(amount) })
  }
  if (!next.some((t) => t.tag === '54')) throw new Error('Payload QRIS tanpa mata uang')

  const body = encode(next) + '6304'
  return body + crc16(body)
}
