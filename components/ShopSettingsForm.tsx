'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ShopSettingsFormProps {
  shop: {
    id: string
    name: string
    location: string | null
    about: string | null
    workingHours: string | null
  }
  plan: {
    name: string
    allowProfileDetails: boolean
  }
}

export default function ShopSettingsForm({ shop, plan }: ShopSettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    location: shop.location || '',
    about: shop.about || '',
    workingHours: shop.workingHours || '',
  })

  const isLocked = !plan.allowProfileDetails

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked) return
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/shop', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: form.location || null,
          about: form.about || null,
          workingHours: form.workingHours || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update shop')
      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4"
    >
      {/* Plan lock banner */}
      {isLocked && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Деталі профілю доступні на вищих планах. Оновіть план щоб розблокувати повний профіль магазину.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          Зміни збережено. Ваша сторінка магазину оновлена.
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="location">Місцезнаходження</Label>
        <Input
          id="location"
          name="location"
          disabled={isLocked}
          value={form.location}
          onChange={handleChange}
          placeholder="Район, місто або адреса"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="workingHours">Години роботи</Label>
        <Input
          id="workingHours"
          name="workingHours"
          disabled={isLocked}
          value={form.workingHours}
          onChange={handleChange}
          placeholder="напр. Пн–Сб 9:00–19:00"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="about">Про магазин</Label>
        <Textarea
          id="about"
          name="about"
          rows={4}
          disabled={isLocked}
          value={form.about}
          onChange={handleChange}
          placeholder="Розкажіть клієнтам про ваш магазин, спеціалізацію та чому варто замовляти у вас."
        />
      </div>

      <div className="pt-1">
        <Button type="submit" disabled={isLocked || loading}>
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Зберігаємо...</>
          ) : (
            'Зберегти зміни'
          )}
        </Button>
      </div>
    </form>
  )
}
