'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface EditFlowerFormProps {
  flower: {
    id: string
    name: string
    price: number
    imageUrl: string | null
    availability: string
    description: string | null
  }
}

export default function EditFlowerForm({ flower }: EditFlowerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: flower.name,
    price: flower.price.toString(),
    imageUrl: flower.imageUrl || '',
    availability: flower.availability,
    description: flower.description || '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/flowers/${flower.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          imageUrl: form.imageUrl || null,
          availability: form.availability,
          description: form.description || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Помилка при збереженні')
      router.push('/dashboard/flowers')
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
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
    >
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Назва букету *</Label>
        <Input
          id="name"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="price">Ціна (₴) *</Label>
        <Input
          id="price"
          name="price"
          type="number"
          min={0}
          step="1"
          required
          value={form.price}
          onChange={handleChange}
        />
        <p className="text-xs text-muted-foreground">
          Ціну можна змінити будь-коли для акцій або знижок.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="imageUrl">Посилання на фото</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          type="url"
          value={form.imageUrl}
          onChange={handleChange}
          placeholder="https://example.com/buket.jpg"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="availability">Наявність *</Label>
        <select
          id="availability"
          name="availability"
          value={form.availability}
          onChange={handleChange}
          className="flex h-11 w-full rounded-xl border border-input bg-gray-50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary transition-colors"
        >
          <option value="in_stock">В наявності</option>
          <option value="limited">Мало залишилось</option>
          <option value="out_of_stock">Немає в наявності</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Опис</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          placeholder="Деталі, розмір, для яких подій підходить..."
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Зберігаємо...</>
        ) : (
          'Зберегти зміни'
        )}
      </Button>
    </form>
  )
}
