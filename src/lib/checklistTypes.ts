import type { Task, ChecklistEventKey, TaskPriority, TaskStatus } from './database.types'

export type { ChecklistEventKey, TaskPriority, TaskStatus }

export type ChecklistEventConfig = {
  key: ChecklistEventKey
  title: string
  shortTitle: string
  description: string
  badgeTone: 'primary' | 'gold' | 'success' | 'warning' | 'neutral'
  icon: string
  isOptional?: boolean
}

export const CHECKLIST_EVENTS: Record<ChecklistEventKey, ChecklistEventConfig> = {
  lamaran: {
    key: 'lamaran',
    title: 'Persiapan Lamaran & Pertemuan Keluarga',
    shortTitle: 'Lamaran',
    description: 'Seserahan, cincin tunangan, busana, konsumsi rombongan, dan rundown lamaran.',
    badgeTone: 'gold',
    icon: 'HeartHandshake',
  },
  pernikahan: {
    key: 'pernikahan',
    title: 'Persiapan Inti Pernikahan & Resepsi',
    shortTitle: 'Pernikahan',
    description: 'Akad, resepsi, katering, venue, busana, MUA, dekorasi, dokumentasi, dan vendor.',
    badgeTone: 'primary',
    icon: 'Sparkles',
  },
  adat: {
    key: 'adat',
    title: 'Acara Adat & Tradisi Keluarga',
    shortTitle: 'Adat & Tradisi',
    description: 'Slametan, pengajian, siraman, midodareni, panggih, sawer, dan tradisi keluarga.',
    badgeTone: 'warning',
    icon: 'Compass',
    isOptional: true,
  },
  legalitas: {
    key: 'legalitas',
    title: 'Berkas, Dokumen KUA & Legalitas',
    shortTitle: 'Berkas KUA',
    description: 'Persyaratan KUA/SIMKAH, Elsimil, dokumen kondisional, dan kontrak kerja vendor.',
    badgeTone: 'success',
    icon: 'FileCheck',
  },
  hari_h_pasca: {
    key: 'hari_h_pasca',
    title: 'Persiapan Hari H & Setelah Menikah',
    shortTitle: 'Hari H & Pasca',
    description: 'Barang bawaan darurat, pengembalian sewa, angpao, ucapan terima kasih, dan Disdukcapil.',
    badgeTone: 'neutral',
    icon: 'CalendarCheck',
  },
}

export type ChecklistItem = Task

export type EventSummary = {
  eventKey: ChecklistEventKey
  title: string
  totalCount: number
  doneCount: number
  pendingCount: number
  completionPercent: number
  estimatedCost: number
  actualCost: number
  costVariance: number
  overdueCount: number
}

export type OverallSummary = {
  totalCount: number
  doneCount: number
  pendingCount: number
  completionPercent: number
  totalEstimatedCost: number
  totalActualCost: number
  costVariance: number // estimated - actual (>0 = hemat, <0 = over budget)
  unpaidItemsCount: number
  overdueCount: number
}

export type CategoryGroup = {
  name: string
  event: ChecklistEventKey
  subcategories: {
    name: string
    items: ChecklistItem[]
  }[]
  uncategorizedItems: ChecklistItem[]
  totalItems: number
  doneItems: number
  completionPercent: number
  totalEstimated: number
  totalActual: number
}
