import { useCallback, useEffect, useState } from 'react'
import { db } from '@/lib/supabase'
import { getCurrentDemoAccount } from '@/lib/demoData'
import { getDemoDeepTalk, getDemoPersonality } from '@/lib/demoStore'
import type { DeepTalkAnswer, PersonalityResult } from '@/lib/database.types'

type Load<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T }

export type PersonalityData = {
  /** Hasil yang boleh dilihat (milik sendiri, dan milik pasangan jika kamu sudah selesai). */
  results: PersonalityResult[]
  /** user_id yang sudah menyelesaikan tes (tanpa isi). */
  completedBy: string[]
}

export function usePersonality(weddingId: string) {
  const [state, setState] = useState<Load<PersonalityData>>({ status: 'loading' })
  const load = useCallback(async () => {
    const demo = getCurrentDemoAccount()
    if (demo) {
      setState({ status: 'ready', data: getDemoPersonality(demo.id) })
      return
    }

    const client = db()
    const [results, progress] = await Promise.all([
      client.from('personality_results').select('*').eq('wedding_id', weddingId),
      client.rpc('personality_progress', { p_wedding_id: weddingId }),
    ])
    if (results.error || progress.error) return setState({ status: 'error' })
    setState({ status: 'ready', data: { results: results.data, completedBy: (progress.data ?? []).map((r) => r.user_id) } })
  }, [weddingId])

  useEffect(() => {
    void load()
  }, [load])
  return { state, reload: load }
}

export type DeepTalkData = {
  answers: DeepTalkAnswer[]
  /** Pasangan pertanyaan yang sudah dijawab: `${userId}:${questionId}` */
  answered: Set<string>
}

export function useDeepTalk(weddingId: string) {
  const [state, setState] = useState<Load<DeepTalkData>>({ status: 'loading' })
  const load = useCallback(async () => {
    const demo = getCurrentDemoAccount()
    if (demo) {
      setState({ status: 'ready', data: getDemoDeepTalk(demo.id) })
      return
    }

    const client = db()
    const [answers, progress] = await Promise.all([
      client.from('deeptalk_answers').select('*').eq('wedding_id', weddingId),
      client.rpc('deeptalk_progress', { p_wedding_id: weddingId }),
    ])
    if (answers.error || progress.error) return setState({ status: 'error' })
    setState({
      status: 'ready',
      data: { answers: answers.data, answered: new Set((progress.data ?? []).map((r) => `${r.user_id}:${r.question_id}`)) },
    })
  }, [weddingId])
  useEffect(() => {
    void load()
  }, [load])
  return { state, reload: load, setState }
}
