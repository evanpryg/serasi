import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { db, isSupabaseConfigured } from '@/lib/supabase'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { PREMIUM_FALLBACK_PRICE, PREMIUM_PLAN_ID } from '@/lib/plans'
import type { PaymentOrder, WeddingEntitlement } from '@/lib/database.types'

/**
 * Status Premium workspace. Sumber kebenaran ada di server (tabel wedding_entitlements,
 * hanya bisa ditulis admin lewat RPC). Di browser ini hanya untuk tampilan — fitur
 * berbayar tetap dijaga database.
 */
type PremiumState = {
  loading: boolean
  isPremium: boolean
  entitlement: WeddingEntitlement | null
  /** Harga paket saat ini (dari tabel plans; fallback sebelum termuat). */
  price: number
  /** Pesanan terakhir workspace ini (bisa sudah kedaluwarsa/ditolak). */
  order: PaymentOrder | null
  isAdmin: boolean
  isDemo: boolean
  /** false = migration pembayaran belum dijalankan di database. */
  paymentsReady: boolean
  refresh: () => Promise<void>
  startOrder: () => Promise<void>
  claimOrder: (payerName: string) => Promise<void>
  cancelOrder: () => Promise<void>
}

const PremiumContext = createContext<PremiumState | null>(null)

/** Pesanan masih bisa dibayar (belum lewat batas waktu). */
export function isOrderPayable(o: PaymentOrder | null): o is PaymentOrder {
  return Boolean(o && o.status === 'pending' && new Date(o.expires_at).getTime() > Date.now())
}

function friendly(err: { message?: string } | null, fallback: string): Error {
  const m = err?.message ?? ''
  if (/sudah Premium/i.test(m)) return new Error('Workspace ini sudah Premium.')
  if (/tidak aktif|kedaluwarsa/i.test(m)) return new Error('Kode pembayaran sudah kedaluwarsa. Buat kode baru.')
  if (/banyak pembayaran/i.test(m)) return new Error('Sedang banyak pembayaran. Coba lagi sebentar.')
  return new Error(fallback)
}

export function PremiumProvider({ weddingId, children }: { weddingId: string; children: ReactNode }) {
  const demo = getCurrentDemoAccount()
  const [loading, setLoading] = useState(!demo)
  const [entitlement, setEntitlement] = useState<WeddingEntitlement | null>(null)
  const [price, setPrice] = useState(PREMIUM_FALLBACK_PRICE)
  const [order, setOrder] = useState<PaymentOrder | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [paymentsReady, setPaymentsReady] = useState(true)

  const load = useCallback(async () => {
    if (getCurrentDemoAccount()) return
    const client = db()
    const [ent, plan, ord, admin] = await Promise.all([
      client.from('wedding_entitlements').select('*').eq('wedding_id', weddingId).maybeSingle(),
      client.from('plans').select('price').eq('id', PREMIUM_PLAN_ID).maybeSingle(),
      client.from('payment_orders').select('*').eq('wedding_id', weddingId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      client.rpc('is_app_admin'),
    ])
    setPaymentsReady(!ent.error && !plan.error)
    const e = ent.data
    setEntitlement(e && (!e.expires_at || new Date(e.expires_at).getTime() > Date.now()) ? e : null)
    if (plan.data) setPrice(plan.data.price)
    setOrder(ord.data ?? null)
    setIsAdmin(admin.data === true)
    setLoading(false)
  }, [weddingId])

  useEffect(() => {
    void load()
  }, [load])

  const startOrder = useCallback(async () => {
    if (getCurrentDemoAccount()) throw new Error('Akun demo tidak bisa melakukan pembayaran. Daftar akun dulu untuk upgrade.')
    const { data, error } = await db().rpc('create_payment_order', { p_wedding_id: weddingId, p_plan_id: PREMIUM_PLAN_ID })
    if (error || !data) throw friendly(error, 'Kode pembayaran gagal dibuat. Periksa koneksi lalu coba lagi.')
    setOrder(data)
  }, [weddingId])

  const claimOrder = useCallback(
    async (payerName: string) => {
      if (!order) return
      const { data, error } = await db().rpc('claim_payment_order', { p_order_id: order.id, p_payer_name: payerName.trim() || null })
      if (error || !data) throw friendly(error, 'Konfirmasi gagal dikirim. Coba lagi.')
      setOrder(data)
    },
    [order],
  )

  const cancelOrder = useCallback(async () => {
    if (!order) return
    const { error } = await db().rpc('cancel_payment_order', { p_order_id: order.id })
    if (error) throw friendly(error, 'Gagal membatalkan. Coba lagi.')
    setOrder({ ...order, status: 'cancelled' })
  }, [order])

  const value = useMemo<PremiumState>(
    () => ({
      loading,
      isPremium: demo ? demo.isPremium : Boolean(entitlement),
      entitlement,
      price,
      order,
      isAdmin,
      isDemo: Boolean(demo),
      paymentsReady,
      refresh: load,
      startOrder,
      claimOrder,
      cancelOrder,
    }),
    [loading, demo, entitlement, price, order, isAdmin, paymentsReady, load, startOrder, claimOrder, cancelOrder],
  )

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
}

export function usePremium(): PremiumState {
  const ctx = useContext(PremiumContext)
  if (!ctx) throw new Error('usePremium harus dipakai di dalam <PremiumProvider>')
  return ctx
}

/** Harga untuk halaman publik (landing). Tabel plans boleh dibaca tanpa login. */
export function usePublicPremiumPrice(): number {
  const [price, setPrice] = useState(PREMIUM_FALLBACK_PRICE)
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    void db()
      .from('plans')
      .select('price')
      .eq('id', PREMIUM_PLAN_ID)
      .maybeSingle()
      .then(({ data }) => active && data && setPrice(data.price))
    return () => {
      active = false
    }
  }, [])
  return price
}
