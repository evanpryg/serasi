import { Controller, type UseFormReturn } from 'react-hook-form'
import { Check } from 'lucide-react'
import { MoneyField, SelectField, TextField } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import {
  CITY_SUGGESTIONS,
  EVENT_TYPE_OPTIONS,
  TRADITION_OPTIONS,
  WEDDING_STYLE_OPTIONS,
  type WeddingFormInput,
  type WeddingFormValues,
} from '@/lib/wedding'

export type WeddingForm = UseFormReturn<WeddingFormInput, unknown, WeddingFormValues>

export function EventFields({ form }: { form: WeddingForm }) {
  const {
    register,
    control,
    formState: { errors },
  } = form
  return (
    <div className="space-y-5">
      <TextField
        label="Nama pasangan atau judul acara"
        placeholder="Contoh: Pernikahan Rina & Dimas"
        error={errors.title?.message}
        {...register('title')}
      />
      <TextField
        label="Nama calon pengantin"
        optional
        placeholder="Contoh: Rina Lestari & Dimas Pratama"
        error={errors.partnerNames?.message}
        {...register('partnerNames')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Tanggal pernikahan"
          type="date"
          optional
          hint="Boleh dikosongkan jika belum pasti."
          error={errors.weddingDate?.message}
          {...register('weddingDate')}
        />
        <TextField label="Kota atau area" list="city-suggestions" autoComplete="address-level2" error={errors.city?.message} {...register('city')} />
        <datalist id="city-suggestions">
          {CITY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <Controller
        control={control}
        name="eventTypes"
        render={({ field, fieldState }) => (
          <fieldset aria-describedby={fieldState.error ? 'event-types-error' : undefined}>
            <legend className="text-sm font-semibold text-ink">Jenis acara</legend>
            <p className="mt-0.5 text-sm text-ink-muted">Pilih semua yang akan kamu rencanakan.</p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {EVENT_TYPE_OPTIONS.map((opt) => {
                const checked = field.value.includes(opt.value)
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      'group relative flex min-h-[3.5rem] cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors duration-150',
                      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
                      checked ? 'border-primary bg-primary-soft/60' : 'border-border bg-surface hover:border-border-strong',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        field.onChange(checked ? field.value.filter((v) => v !== opt.value) : [...field.value, opt.value])
                      }
                    />
                    <span
                      aria-hidden
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                        checked ? 'border-primary bg-primary text-on-primary' : 'border-border-strong bg-surface',
                      )}
                    >
                      {checked && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">{opt.label}</span>
                      <span className="block text-xs text-ink-muted">{opt.description}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {fieldState.error && (
              <p id="event-types-error" role="alert" className="mt-2 text-sm text-danger">
                {fieldState.error.message}
              </p>
            )}
          </fieldset>
        )}
      />
    </div>
  )
}

export function BudgetFields({ form }: { form: WeddingForm }) {
  const {
    register,
    control,
    formState: { errors },
  } = form
  return (
    <div className="space-y-5">
      <Controller
        control={control}
        name="budgetTarget"
        render={({ field, fieldState }) => (
          <MoneyField
            label="Target anggaran"
            hint="Batas total biaya yang ingin kamu habiskan. Bisa diubah kapan saja."
            value={field.value ?? null}
            onChange={(v) => field.onChange(v)}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="availableFunds"
        render={({ field, fieldState }) => (
          <MoneyField
            label="Dana yang sudah tersedia"
            hint="Total uang yang sudah terkumpul untuk pernikahan, termasuk yang nanti kamu catat sebagai pembayaran. Isi 0 jika belum ada."
            value={field.value ?? null}
            onChange={(v) => field.onChange(v)}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <TextField
        label="Perkiraan jumlah tamu"
        type="number"
        inputMode="numeric"
        min={0}
        optional
        hint="Dipakai untuk memperkirakan porsi katering."
        error={errors.guestEstimate?.message}
        {...register('guestEstimate', { setValueAs: (v) => (v === '' || v == null ? null : Number(v)) })}
      />
    </div>
  )
}

export function StyleFields({ form }: { form: WeddingForm }) {
  const {
    register,
    formState: { errors },
  } = form
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <SelectField
        label="Gaya pernikahan"
        optional
        placeholder="Belum ditentukan"
        options={WEDDING_STYLE_OPTIONS}
        error={errors.weddingStyle?.message}
        {...register('weddingStyle', { setValueAs: (v) => v ?? '' })}
      />
      <SelectField
        label="Adat atau tradisi"
        optional
        placeholder="Belum ditentukan"
        options={TRADITION_OPTIONS}
        error={errors.tradition?.message}
        {...register('tradition', { setValueAs: (v) => v ?? '' })}
      />
    </div>
  )
}
