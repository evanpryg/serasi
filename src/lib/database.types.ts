/**
 * Tipe tabel Supabase (ditulis manual, sesuai supabase/migrations).
 * Bisa digantikan hasil generate:
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */
type Timestamps = { created_at: string; updated_at: string }

export type EventType = 'lamaran' | 'akad' | 'resepsi' | 'akad_resepsi' | 'keluarga'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type WeddingVendorStatus = 'kandidat' | 'dihubungi' | 'dipertimbangkan' | 'dipilih' | 'dibatalkan'
export type PaymentStatus = 'scheduled' | 'paid' | 'cancelled'
export type PaymentType = 'dp' | 'termin' | 'pelunasan' | 'lainnya'
export type ExpenseStatus = 'planned' | 'paid' | 'cancelled'

export type Profile = Timestamps & {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export type Wedding = Timestamps & {
  id: string
  owner_id: string
  title: string
  partner_names: string | null
  wedding_date: string | null
  city: string
  event_types: EventType[]
  guest_estimate: number | null
  budget_target: number
  available_funds: number
  wedding_style: string | null
  tradition: string | null
  cover_photo_path: string | null
}

export type MemberRole = 'owner' | 'partner'

export type WeddingMember = {
  wedding_id: string
  user_id: string
  role: MemberRole
  joined_at: string
}

export type WeddingInvite = {
  id: string
  wedding_id: string
  code: string
  created_by: string
  created_at: string
  expires_at: string
  accepted_by: string | null
  accepted_at: string | null
  revoked_at: string | null
}

export type PersonalityResult = {
  wedding_id: string
  user_id: string
  type_code: string
  scores: Record<'E' | 'S' | 'T' | 'J', number>
  answers: Record<string, number>
  completed_at: string
}

export type DeepTalkAnswer = {
  wedding_id: string
  user_id: string
  question_id: string
  answer: string
  alignment: 'sejalan' | 'perlu_dibahas' | 'berbeda' | null
  created_at: string
  updated_at: string
}

export type BudgetCategory = Timestamps & {
  id: string
  wedding_id: string
  name: string
  planned_amount: number
  is_reserve: boolean
  is_archived: boolean
  sort_order: number
  notes: string | null
  template_key: string | null
}

export type WeddingVendor = Timestamps & {
  id: string
  wedding_id: string
  vendor_id: string | null
  category_id: string | null
  custom_name: string | null
  vendor_category: string | null
  status: WeddingVendorStatus
  quoted_amount: number | null
  contract_amount: number | null
  service_scope: string | null
  extra_costs_note: string | null
  contact_note: string | null
  notes: string | null
}

export type Expense = Timestamps & {
  id: string
  wedding_id: string
  category_id: string
  vendor_id: string | null
  title: string
  amount: number
  expense_date: string | null
  status: ExpenseStatus
  fund_source: string | null
  proof_path: string | null
  notes: string | null
}

export type Payment = Timestamps & {
  id: string
  wedding_id: string
  wedding_vendor_id: string | null
  amount: number
  payment_date: string | null
  due_date: string | null
  status: PaymentStatus
  payment_type: PaymentType
  fund_source: string | null
  proof_path: string | null
  notes: string | null
}

export type ChecklistEventKey = 'lamaran' | 'pernikahan' | 'adat' | 'legalitas' | 'hari_h_pasca'

export type Task = Timestamps & {
  id: string
  wedding_id: string
  title: string
  category: string
  subcategory?: string | null
  event?: ChecklistEventKey | string | null
  due_date: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee: string | null
  notes: string | null
  is_archived: boolean
  sort_order: number
  template_key: string | null
  completed_at: string | null
  estimated_cost?: number | null
  actual_cost?: number | null
  quantity?: number | null
  unit?: string | null
  product_url?: string | null
  vendor_store_name?: string | null
  item_status?: string | null
  is_custom?: boolean
}

export type Guest = Timestamps & {
  id: string
  wedding_id: string
  name: string
  group_name: string | null
  guest_count: number
  invitation_status: 'belum' | 'terkirim'
  rsvp_status: 'menunggu' | 'hadir' | 'tidak_hadir'
  notes: string | null
}

export type RundownItem = Timestamps & {
  id: string
  wedding_id: string
  title: string
  starts_at: string | null
  ends_at: string | null
  location: string | null
  person_in_charge: string | null
  sort_order: number
  notes: string | null
}

type Table<Row, Required extends keyof Row> = {
  Row: Row
  Insert: Partial<Row> & Pick<Row, Required>
  Update: Partial<Row>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, 'id'>
      weddings: Table<Wedding, 'title' | 'city'>
      budget_categories: Table<BudgetCategory, 'wedding_id' | 'name'>
      wedding_vendors: Table<WeddingVendor, 'wedding_id'>
      expenses: Table<Expense, 'wedding_id' | 'category_id' | 'title' | 'amount'>
      payments: Table<Payment, 'wedding_id' | 'amount'>
      tasks: Table<Task, 'wedding_id' | 'title'>
      guests: Table<Guest, 'wedding_id' | 'name'>
      rundown_items: Table<RundownItem, 'wedding_id' | 'title'>
      wedding_members: Table<WeddingMember, 'wedding_id' | 'user_id' | 'role'>
      wedding_invites: Table<WeddingInvite, 'wedding_id' | 'code'>
      personality_results: Table<PersonalityResult, 'wedding_id' | 'type_code' | 'scores' | 'answers'>
      deeptalk_answers: Table<DeepTalkAnswer, 'wedding_id' | 'question_id' | 'answer'>
    }
    Views: { [_ in never]: never }
    Functions: {
      create_wedding_workspace: {
        Args: {
          p_title: string
          p_city: string
          p_event_types: EventType[]
          p_budget_target: number
          p_available_funds: number
          p_partner_names?: string | null
          p_wedding_date?: string | null
          p_guest_estimate?: number | null
          p_wedding_style?: string | null
          p_tradition?: string | null
          p_auto_allocate?: boolean
        }
        Returns: string
      }
      apply_checklist_template: { Args: { p_wedding_id: string }; Returns: number }
      create_wedding_invite: { Args: Record<string, never>; Returns: string }
      get_invite_preview: {
        Args: { p_code: string }
        Returns: { wedding_title: string; wedding_date: string | null; inviter_name: string | null }[]
      }
      accept_wedding_invite: { Args: { p_code: string }; Returns: string }
      personality_progress: { Args: { p_wedding_id: string }; Returns: { user_id: string; completed_at: string }[] }
      deeptalk_progress: { Args: { p_wedding_id: string }; Returns: { user_id: string; question_id: string }[] }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
