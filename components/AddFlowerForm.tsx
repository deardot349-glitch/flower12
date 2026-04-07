'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, X, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

function getDaysAge(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diff === 0) return 'Зроблено сьогодні'
  if (diff === 1) return '1 день тому'
  if (diff < 5) return `${diff} дні тому`
  return `${diff} днів тому`
}

export default function AddFlowerForm({ shopId, currency = 'UAH' }: { shopId: string; currency?: string }) {
  const currencySymbol = currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]
  const [formData, setFormData] = useState({
    name: '', price: '', imageUrl: '', availability: 'in_stock', description: '', madeAt: today,
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Файл занадто великий', description: 'Максимальний розмір — 5МБ.' })
      return
    }
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Невірний формат', description: 'Будь ласка, оберіть файл зображення.' })
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'flower')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Помилка завантаження')
      setFormData(prev => ({ ...prev, imageUrl: data.url }))
      setImagePreview(data.url)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Помилка завантаження', description: err.message })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/flowers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, ...formData, price: parseFloat(formData.price), madeAt: formData.madeAt || null }),
      })
      if (!res.ok) throw new Error()
      toast({ variant: 'success', title: 'Букет додано!' })
      router.refresh()
      setFormData({ name: '', price: '', imageUrl: '', availability: 'in_stock', description: '', madeAt: today })
      setImagePreview(null)
    } catch {
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося додати букет. Спробуйте ще раз.' })
    } finally {
      setLoading(false)
    }
  }

  const ageLabel = getDaysAge(formData.madeAt)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Назва букету *</Label>
        <Input
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Троянди мікс"
        />
      </div>

      {/* Price */}
      <div className="space-y-1.5">
        <Label htmlFor="price">Ціна ({currencySymbol}) *</Label>
        <Input
          id="price"
          type="number"
          step="1"
          min="0"
          required
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="450"
        />
      </div>

      {/* Date made */}
      <div className="space-y-1.5">
        <Label htmlFor="madeAt">Дата виготовлення</Label>
        <Input
          id="madeAt"
          type="date"
          value={formData.madeAt}
          max={today}
          onChange={(e) => setFormData({ ...formData, madeAt: e.target.value })}
        />
        {ageLabel && (
          <p className="text-xs font-medium text-pink-600 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {ageLabel}
          </p>
        )}
      </div>

      {/* Photo upload */}
      <div className="space-y-1.5">
        <Label>Фото букету</Label>
        {imagePreview && (
          <div className="relative h-40 rounded-2xl overflow-hidden border border-gray-200 mb-2">
            <Image src={imagePreview} alt="Попередній перегляд" fill className="object-cover" />
            <button
              type="button"
              onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, imageUrl: '' })) }}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500 p-1.5 rounded-full shadow-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <label className="cursor-pointer block">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-pink-400 transition-colors bg-gray-50">
            {uploading ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="h-6 w-6 text-pink-500 animate-spin" />
                <p className="text-xs text-muted-foreground">Завантаження...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-6 w-6 text-gray-400" />
                <p className="text-xs font-semibold text-gray-700">Натисніть щоб завантажити</p>
                <p className="text-xs text-muted-foreground">PNG, JPG до 5МБ</p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Availability */}
      <div className="space-y-1.5">
        <Label htmlFor="availability">Наявність *</Label>
        <select
          id="availability"
          required
          value={formData.availability}
          onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
          className="flex h-11 w-full rounded-xl border border-input bg-gray-50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary transition-colors"
        >
          <option value="in_stock">В наявності</option>
          <option value="limited">Мало залишилось</option>
          <option value="out_of_stock">Немає в наявності</option>
        </select>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Опис</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Розкажіть про цей букет..."
        />
      </div>

      <Button type="submit" disabled={loading || uploading} className="w-full" size="lg">
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Зберігаємо...</>
        ) : (
          'Додати букет'
        )}
      </Button>
    </form>
  )
}
