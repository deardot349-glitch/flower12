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
  flower: Flower
  shopId: string
  onClose: () => void
}

export default function OrderModal({ flower, shopId, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({ customerName: '', phone: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, flowerId: flower.id, ...formData }),
      })
      if (!response.ok) throw new Error()
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setFormData({ customerName: '', phone: '', message: '' })
      }, 2500)
    } catch {
      // TODO: replace with toast once wired at page level
      alert('Не вдалося відправити замовлення. Спробуйте ще раз.')
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
            <p className="text-sm text-muted-foreground">Ми зв'яжемося з вами найближчим часом.</p>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Ім'я та прізвище *</Label>
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
                  <span className="text-muted-foreground font-normal">(необов'язково)</span>
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
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                >
                  Скасувати
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-[2]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Надсилаємо...
                    </>
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
