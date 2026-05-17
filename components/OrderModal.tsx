'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Flower {
  id: string
  name: string
  price: number
}

interface Props {
  flower:    Flower
  shopSlug:  string       // ← slug, never ID
  onClose:   () => void
}

export default function OrderModal({ flower, shopSlug, onClose }: Props) {
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [formData, setFormData] = useState({ customerName: '', phone: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation before network call
    if (!formData.customerName.trim() || formData.customerName.trim().length < 2) {
      setError("Введіть ім'я (мінімум 2 символи)")
      return
    }
    if (!formData.phone.trim() || !/^\+?[\d\s\-\(\)]{7,}$/.test(formData.phone)) {
      setError('Введіть дійсний номер телефону')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          shopSlug,                     // server resolves shopId from slug
          flowerId:     flower.id,
          customerName: formData.customerName,
          phone:        formData.phone,
          message:      formData.message || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Не вдалося відправити замовлення.')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setFormData({ customerName: '', phone: '', message: '' })
      }, 2500)
    } catch {
      setError('Сталася помилка. Перевірте інтернет і спробуйте знову.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        {success ? (
          <div className="px-6 py-10 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-14 w-14 text-green-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Замовлення прийнято!</h2>
            <p className="text-sm text-muted-foreground">Ми зв&apos;яжемося з вами найближчим часом.</p>
          </div>
        ) : (
          <div className="px-6 pb-6 pt-2">
            <DialogHeader className="mb-5 pr-6">
              <DialogTitle>Замовити</DialogTitle>
              <DialogDescription>
                {flower.name} ·{' '}
                <span className="font-semibold text-pink-600">₴{flower.price.toFixed(0)}</span>
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Ім&apos;я та прізвище *</Label>
                <Input
                  id="customerName"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Ірина Ковальчук"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Номер телефону *</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+380 99 123 45 67"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">
                  Побажання{' '}
                  <span className="text-muted-foreground font-normal">(необов&apos;язково)</span>
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  placeholder="Текст на листівку, особливі побажання..."
                />
              </div>

              <div className="flex gap-3 pt-2 pb-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={loading} className="flex-[2]">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Надсилаємо...</>
                  ) : (
                    'Замовити'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
