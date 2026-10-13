import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Feedback'

/** Halaman modul yang dibangun di sprint berikutnya (lihat PRD §16). */
export function ComingSoonPage({ title, description, icon, emptyTitle, emptyText }: { title: string; description: string; icon: ReactNode; emptyTitle: string; emptyText: string }) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[2.4rem] font-semibold leading-tight sm:text-5xl">{title}</h1>
          <Badge tone="gold">Segera hadir</Badge>
        </div>
        <p className="mt-1 text-ink-muted">{description}</p>
      </header>
      <EmptyState icon={icon} title={emptyTitle} description={emptyText} />
    </div>
  )
}
