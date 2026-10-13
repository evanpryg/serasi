import { describe, expect, it } from 'vitest'
import { QUESTIONS, TYPE_PROFILES, isComplete, pairInsights, scoreAnswers, type Answers, type TypeCode } from './personality'
import { ALL_QUESTIONS, TOPICS, questionStatus } from './deeptalk'

const answerAll = (fn: (q: (typeof QUESTIONS)[number]) => number): Answers =>
  Object.fromEntries(QUESTIONS.map((q) => [q.id, fn(q)]))

describe('tes kepribadian', () => {
  it('punya 10 butir seimbang per dimensi dan id unik (total 40 butir)', () => {
    const ids = new Set(QUESTIONS.map((q) => q.id))
    expect(ids.size).toBe(QUESTIONS.length)
    expect(QUESTIONS).toHaveLength(40)
    for (const dim of ['EI', 'SN', 'TF', 'JP']) expect(QUESTIONS.filter((q) => q.dimension === dim)).toHaveLength(10)
  })

  it('menolak jawaban yang belum lengkap', () => {
    expect(isComplete({})).toBe(false)
    expect(() => scoreAnswers({ e1: 5 })).toThrow()
  })

  it('setuju penuh pada kutub pertama → ESTJ 100%', () => {
    const r = scoreAnswers(answerAll((q) => (['E', 'S', 'T', 'J'].includes(q.pole) ? 5 : 1)))
    expect(r.type).toBe('ESTJ')
    expect(r.scores).toEqual({ E: 100, S: 100, T: 100, J: 100 })
  })

  it('setuju penuh pada kutub kedua → INFP 0%', () => {
    const r = scoreAnswers(answerAll((q) => (['I', 'N', 'F', 'P'].includes(q.pole) ? 5 : 1)))
    expect(r.type).toBe('INFP')
    expect(r.scores).toEqual({ E: 0, S: 0, T: 0, J: 0 })
  })

  it('semua netral → seri 50% dihitung huruf pertama', () => {
    const r = scoreAnswers(answerAll(() => 3))
    expect(r.type).toBe('ESTJ')
    expect(r.scores.E).toBe(50)
  })

  it('punya profil untuk ke-16 tipe dengan data rumah tangga mendalam', () => {
    expect(Object.keys(TYPE_PROFILES)).toHaveLength(16)
    for (const profile of Object.values(TYPE_PROFILES)) {
      expect(profile.maritalFrictions.length).toBeGreaterThanOrEqual(3)
      expect(profile.whenAngry.behavior).toBeDefined()
      expect(profile.socialAndInLaws.advice).toBeDefined()
      expect(profile.domesticLifestyle.commStyle).toBeDefined()
    }
  })

  it('wawasan pasangan membedakan dimensi sama/berbeda', () => {
    const insights = pairInsights('INFJ' as TypeCode, 'ENFP' as TypeCode)
    expect(insights.map((i) => i.same)).toEqual([false, true, true, false])
    expect(insights[1]!.title).toContain('Sama-sama')
    expect(insights[0]!.title).toContain('Ekstrovert & Introvert')
  })

})

describe('deep talk', () => {
  it('id pertanyaan unik dan sesuai format database', () => {
    const ids = ALL_QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9_]{2,40}$/)
    expect(TOPICS.length).toBe(8)
    // Angka ini disebut di landing page
    expect(ids).toHaveLength(40)
  })

  it('status gabungan', () => {
    const s = (mine: boolean, partner: boolean, ma: any = null, pa: any = null) =>
      questionStatus({ mineAnswered: mine, partnerAnswered: partner, mineAlignment: ma, partnerAlignment: pa })
    expect(s(false, false)).toBe('belum_dijawab')
    expect(s(false, true)).toBe('pasangan_menunggu')
    expect(s(true, false)).toBe('menunggu_pasangan')
    expect(s(true, true, 'sejalan', null)).toBe('perlu_dinilai')
    expect(s(true, true, 'sejalan', 'sejalan')).toBe('sejalan')
    expect(s(true, true, 'sejalan', 'perlu_dibahas')).toBe('perlu_dibahas')
    expect(s(true, true, 'perlu_dibahas', 'berbeda')).toBe('berbeda')
  })
})
