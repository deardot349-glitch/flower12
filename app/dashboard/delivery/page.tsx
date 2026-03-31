'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DeliveryZone {
  id: string
  name: string
  fee: number
  estimatedMinHours: number
  estimatedMaxHours: number
  sameDayAvailable: boolean
  minimumOrder: number
  active: boolean
  sortOrder: number
}

const emptyZone = {
  name: '',
  fee: 0,
  estimatedMinHours: 2,
  estimatedMaxHours: 4,
  sameDayAvailable: true,
  minimumOrder: 0,
  active: true,
}

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [planAllows, setPlanAllows] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState(emptyZone)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => { fetchZones() }, [])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/delivery-zones')
      const data = await res.json()
      if (data.zones) setZones(data.zones)
      if (data.planAllows === false) setPlanAllows(false)
    } catch (err) {
      console.error('Failed to load zones:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAddForm = () => {
    setEditingZone(null)
    setFormData(emptyZone)
    setShowForm(true)
  }

  const openEditForm = (zone: DeliveryZone) => {
    setEditingZone(zone)
    setFormData({
      name: zone.name,
      fee: zone.fee,
      estimatedMinHours: zone.estimatedMinHours,
      estimatedMaxHours: zone.estimatedMaxHours,
      sameDayAvailable: zone.sameDayAvailable,
      minimumOrder: zone.minimumOrder,
      active: zone.active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingZone ? `/api/delivery-zones/${editingZone.id}` : '/api/delivery-zones'
      const method = editingZone ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        showToast(editingZone ? '✅ Зону оновлено!' : '✅ Зону додано!', 'success')
        setShowForm(false)
        fetchZones()
      } else {
        const data = await res.json()
        showToast(data.error || 'Помилка збереження', 'error')
      }
    } catch {
      showToast('Помилка мережі', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити зону доставки?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/delivery-zones/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('✅ Зону видалено', 'success')
        setZones(zones.filter(z => z.id !== id))
      } else {
        showToast('Помилка видалення', 'error')
      }
    } catch {
      showToast('Помилка мережі', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      const res = await fetch(`/api/delivery-zones/${zone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...zone, active: !zone.active }),
      })
      if (res.ok) {
        setZones(zones.map(z => z.id === zone.id ? { ...z, active: !z.active } : z))
      }
    } catch {
      showToast('Помилка оновлення', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-semibold transition-all ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🚚 Зони доставки</h1>
            <p className="text-gray-500 mt-1">Налаштуйте райони доставки та вартість</p>
          </div>
          {planAllows && (
            <button onClick={openAddForm}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-md text-sm">
              + Додати зону
            </button>
          )}
        </div>

        {/* Plan gate */}
        {!loading && !planAllows && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-black text-amber-900 mb-2">Зони доставки — Базовий або Преміум план</h3>
            <p className="text-amber-700 text-sm mb-6 max-w-md mx-auto">
              Налаштування зон доставки доступне на планах <strong>Базовий</strong> або <strong>Преміум</strong>.
              Перейдіть на платний план щоб показувати клієнтам умови та вартість доставки.
            </p>
            <Link href="/dashboard/subscription"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md">
              🌸 Перейти на Базовий — 900 грн/міс
            </Link>
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && planAllows && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingZone ? 'Редагувати зону' : 'Нова зона доставки'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Назва зони *</label>
                  <input type="text" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="напр. Центр міста, Передмістя"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Вартість доставки</label>
                    <input type="number" min="0" step="0.01" value={formData.fee}
                      onChange={e => setFormData({ ...formData, fee: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                    <p className="text-xs text-gray-400 mt-1">0 = безкоштовно</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Мін. сума замовлення</label>
                    <input type="number" min="0" step="0.01" value={formData.minimumOrder}
                      onChange={e => setFormData({ ...formData, minimumOrder: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                    <p className="text-xs text-gray-400 mt-1">0 = без мінімуму</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Час доставки (годин)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Мін.</label>
                      <input type="number" min="0" value={formData.estimatedMinHours}
                        onChange={e => setFormData({ ...formData, estimatedMinHours: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Макс.</label>
                      <input type="number" min="0" value={formData.estimatedMaxHours}
                        onChange={e => setFormData({ ...formData, estimatedMaxHours: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Клієнт бачить: {formData.estimatedMinHours}–{formData.estimatedMaxHours} год</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Доставка в той самий день</p>
                    <p className="text-xs text-gray-400">Дозволити замовлення з доставкою сьогодні</p>
                  </div>
                  <button type="button"
                    onClick={() => setFormData({ ...formData, sameDayAvailable: !formData.sameDayAvailable })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.sameDayAvailable ? 'bg-pink-500' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${formData.sameDayAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Активна</p>
                    <p className="text-xs text-gray-400">Показувати зону клієнтам</p>
                  </div>
                  <button type="button"
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.active ? 'bg-pink-500' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${formData.active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                    Скасувати
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-60">
                    {saving ? 'Зберігаємо...' : editingZone ? 'Оновити' : 'Додати зону'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Zones List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto" />
          </div>
        ) : planAllows && zones.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Зон доставки ще немає</h3>
            <p className="text-gray-500 text-sm mb-6">Додайте зони щоб клієнти бачили куди і за скільки ви доставляєте</p>
            <button onClick={openAddForm}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-md">
              + Додати першу зону
            </button>
          </div>
        ) : planAllows ? (
          <div className="space-y-4">
            {zones.map(zone => (
              <div key={zone.id} className={`bg-white rounded-2xl shadow-sm p-5 transition-all ${!zone.active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🚚</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{zone.name}</h3>
                        {!zone.active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Неактивна</span>}
                        {zone.sameDayAvailable && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">⚡ Того ж дня</span>}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                        <span>💰 Доставка: <strong>{zone.fee === 0 ? 'Безкоштовно' : `${zone.fee} грн`}</strong></span>
                        <span>⏱️ Час: <strong>{zone.estimatedMinHours}–{zone.estimatedMaxHours} год</strong></span>
                        {zone.minimumOrder > 0 && <span>🛒 Мін. замовлення: <strong>{zone.minimumOrder} грн</strong></span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleToggleActive(zone)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${zone.active ? 'bg-pink-500' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${zone.active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <button onClick={() => openEditForm(zone)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">✏️</button>
                    <button onClick={() => handleDelete(zone.id)} disabled={deletingId === zone.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                      {deletingId === zone.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              <strong>💡 Порада:</strong> Зони доставки відображаються клієнтам на сторінці вашого магазину при оформленні замовлення.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
