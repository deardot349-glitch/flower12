'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Bouquet {
  id: string; name: string; price: number; imageUrl: string | null
  availability: string; description: string | null; madeAt: string | null
  isCustom: boolean
}
interface StockFlower {
  id: string; name: string; color: string | null; pricePerStem: number
  stockCount: number; imageUrl: string | null
}
interface WrappingOption {
  id: string; name: string; price: number; imageUrl: string | null; available: boolean
}
interface CustomExtra {
  id: string; name: string; description: string | null; price: number
  imageUrl: string | null; available: boolean
}
interface PlanInfo {
  current: number
  max: number
  planSlug: string
  allowCustomBouquet: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysAge(madeAt: string | null): string {
  if (!madeAt) return ''
  const diff = Math.floor((Date.now() - new Date(madeAt).getTime()) / 86400000)
  if (diff === 0) return 'Сьогодні'
  if (diff === 1) return '1 день'
  if (diff < 5) return `${diff} дні`
  return `${diff} днів`
}

const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition-all bg-gray-50'

async function uploadImage(file: File, type: string): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('type', type)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

// ─── Premium Gate Banner ──────────────────────────────────────────────────────
function PremiumGate({ feature }: { feature: string }) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h3 className="text-xl font-black text-amber-900 mb-2">Лише для Преміум плану</h3>
      <p className="text-amber-700 text-sm mb-6 max-w-md mx-auto">
        {feature} доступне лише на тарифі <strong>Преміум</strong>. Оновіть план щоб розблокувати цю функцію та багато іншого.
      </p>
      <Link href="/dashboard/subscription"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md">
        🌺 Перейти на Преміум — 1500 грн/міс
      </Link>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, count, onAdd, addLabel }: {
  icon: string; title: string; subtitle: string; count: number
  onAdd: () => void; addLabel: string
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl flex items-center justify-center text-xl">{icon}</div>
        <div>
          <h2 className="font-black text-gray-900 text-lg">
            {title}
            <span className="ml-2 text-sm font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
          </h2>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <button onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-pink-600 hover:to-purple-700 transition-all shadow-md">
        ➕ {addLabel}
      </button>
    </div>
  )
}

// ─── Image Upload Box (each instance has its own ref) ────────────────────────
function ImageUploadBox({
  imageUrl, onUpload, onRemove, uploading
}: {
  imageUrl: string
  onUpload: (file: File) => Promise<void>
  onRemove: () => void
  uploading: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Фото (необов'язково)</label>
      {imageUrl ? (
        <div className="relative h-36 rounded-xl overflow-hidden border border-gray-200">
          <Image src={imageUrl} alt="preview" fill className="object-cover" />
          <button type="button" onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-xs font-bold hover:bg-red-600 flex items-center justify-center shadow-md">
            ✕
          </button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && ref.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50/50 transition-all select-none">
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500" />
              Завантаження...
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <div className="text-2xl mb-1">📷</div>
              Натисніть щоб завантажити фото
              <div className="text-xs text-gray-400 mt-1">PNG, JPG, WebP — до 5MB</div>
            </div>
          )}
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) await onUpload(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssortmentPage() {
  const today = new Date().toISOString().split('T')[0]

  const [tab, setTab] = useState<'bouquets' | 'stock' | 'wrapping' | 'extras'>('bouquets')
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)

  // Data
  const [bouquets, setBouquets] = useState<Bouquet[]>([])
  const [stockFlowers, setStockFlowers] = useState<StockFlower[]>([])
  const [wrapping, setWrapping] = useState<WrappingOption[]>([])
  const [extras, setExtras] = useState<CustomExtra[]>([])
  const [currency, setCurrency] = useState('UAH')

  // UI
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [editingBouquet, setEditingBouquet] = useState<Bouquet | null>(null)
  const [editForm, setEditForm] = useState({ name: '', price: '', imageUrl: '', availability: 'in_stock', description: '', madeAt: '', isCustom: false })

  // Forms — each tab has its own imageUrl state so uploads don't conflict
  const [bouquetForm, setBouquetForm] = useState({
    name: '', price: '', imageUrl: '', availability: 'in_stock', description: '', madeAt: today, isCustom: false
  })
  const [stockForm, setStockForm] = useState({
    name: '', color: '', pricePerStem: '', stockCount: '', imageUrl: ''
  })
  const [wrappingForm, setWrappingForm] = useState({ name: '', price: '', imageUrl: '' })
  const [extraForm, setExtraForm] = useState({ name: '', description: '', price: '', imageUrl: '' })

  const currencySymbol = currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'

  // Read ?tab= from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const t = params.get('tab') as typeof tab | null
      if (t && ['bouquets', 'stock', 'wrapping', 'extras'].includes(t)) setTab(t)
    }
  }, [])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [shopRes, bouquetsRes, stockRes, wrappingRes, extrasRes] = await Promise.all([
        fetch('/api/shop').then(r => r.json()).catch(() => ({})),
        fetch('/api/assortment/bouquets').then(r => r.json()).catch(() => ({})),
        fetch('/api/dashboard/stock-flowers').then(r => r.json()).catch(() => ({})),
        fetch('/api/dashboard/wrapping').then(r => r.json()).catch(() => ({})),
        fetch('/api/dashboard/custom-extras').then(r => r.json()).catch(() => ({})),
      ])

      const planSlug: string = shopRes.shop?.plan?.slug || 'free'
      if (shopRes.shop?.currency) setCurrency(shopRes.shop.currency)

      // Always set planInfo from shop response so isPremium is reliable
      setPlanInfo({
        current: bouquetsRes.planInfo?.current ?? (bouquetsRes.bouquets?.length || 0),
        max: bouquetsRes.planInfo?.max ?? (shopRes.shop?.plan?.maxBouquets || 5),
        planSlug,
        allowCustomBouquet: planSlug === 'premium',
      })

      if (Array.isArray(bouquetsRes.bouquets)) setBouquets(bouquetsRes.bouquets)
      if (Array.isArray(stockRes.flowers)) setStockFlowers(stockRes.flowers)
      if (Array.isArray(wrappingRes.options)) setWrapping(wrappingRes.options)
      if (Array.isArray(extrasRes.extras)) setExtras(extrasRes.extras)
    } catch (err) {
      console.error('fetchAll error:', err)
    } finally {
      setPageLoading(false)
    }
  }

  const notify = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }
  const fail = (msg: string) => { setError(msg); setTimeout(() => setError(''), 5000) }

  const handleUpload = async (file: File, type: string): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) throw new Error('Файл занадто великий (макс 5MB)')
    setUploading(true)
    try {
      return await uploadImage(file, type)
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setShowForm(false); setError('')
    setEditingBouquet(null)
    setBouquetForm({ name: '', price: '', imageUrl: '', availability: 'in_stock', description: '', madeAt: today, isCustom: false })
    setStockForm({ name: '', color: '', pricePerStem: '', stockCount: '', imageUrl: '' })
    setWrappingForm({ name: '', price: '', imageUrl: '' })
    setExtraForm({ name: '', description: '', price: '', imageUrl: '' })
  }

  const startEditBouquet = (b: Bouquet) => {
    setEditingBouquet(b)
    setEditForm({
      name: b.name,
      price: String(b.price),
      imageUrl: b.imageUrl || '',
      availability: b.availability,
      description: b.description || '',
      madeAt: b.madeAt ? b.madeAt.split('T')[0] : '',
      isCustom: b.isCustom ?? false
    })
    setShowForm(false)
    setError('')
  }

  const submitEditBouquet = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const price = parseFloat(editForm.price)
      if (!editForm.name.trim()) throw new Error('Введіть назву букету')
      if (isNaN(price) || price < 0) throw new Error('Введіть коректну ціну')
      const res = await fetch(`/api/flowers/${editingBouquet!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          price,
          imageUrl: editForm.imageUrl || null,
          availability: editForm.availability,
          description: editForm.description.trim() || null,
          madeAt: editForm.madeAt || null,
          isCustom: editForm.isCustom
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Помилка збереження')
      notify('✅ Букет оновлено!'); setEditingBouquet(null); fetchAll()
    } catch (err: any) { fail(err.message) }
    finally { setLoading(false) }
  }

  // ── Submits ──────────────────────────────────────────────────────────────────
  const submitBouquet = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const price = parseFloat(bouquetForm.price)
      if (!bouquetForm.name.trim()) throw new Error('Введіть назву букету')
      if (isNaN(price) || price < 0) throw new Error('Введіть коректну ціну')
      const res = await fetch('/api/flowers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bouquetForm.name.trim(),
          price,
          imageUrl: bouquetForm.imageUrl || null,
          availability: bouquetForm.availability,
          description: bouquetForm.description.trim() || null,
          madeAt: bouquetForm.madeAt || null,
          isCustom: bouquetForm.isCustom
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Помилка збереження')
      notify('✅ Букет додано!'); resetForm(); fetchAll()
    } catch (err: any) { fail(err.message) }
    finally { setLoading(false) }
  }

  const submitStock = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/dashboard/stock-flowers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stockForm,
          pricePerStem: parseFloat(stockForm.pricePerStem),
          stockCount: parseInt(stockForm.stockCount)
        })
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Помилка') }
      notify('✅ Квітку додано!'); resetForm(); fetchAll()
    } catch (err: any) { fail(err.message) }
    finally { setLoading(false) }
  }

  const submitWrapping = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/dashboard/wrapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...wrappingForm, price: parseFloat(wrappingForm.price) || 0 })
      })
      if (!res.ok) throw new Error('Помилка')
      notify('✅ Упаковку додано!'); resetForm(); fetchAll()
    } catch (err: any) { fail(err.message) }
    finally { setLoading(false) }
  }

  const submitExtra = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/dashboard/custom-extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...extraForm, price: parseFloat(extraForm.price) || 0 })
      })
      if (!res.ok) throw new Error('Помилка')
      notify('✅ Елемент додано!'); resetForm(); fetchAll()
    } catch (err: any) { fail(err.message) }
    finally { setLoading(false) }
  }

  // ── Toggles ──────────────────────────────────────────────────────────────────
  const toggleBouquet = async (b: Bouquet) => {
    setTogglingId(b.id)
    await fetch(`/api/flowers/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability: b.availability === 'in_stock' ? 'out_of_stock' : 'in_stock' })
    })
    fetchAll(); setTogglingId(null)
  }
  const toggleWrapping = async (w: WrappingOption) => {
    setTogglingId(w.id)
    await fetch('/api/dashboard/wrapping', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: w.id, available: !w.available })
    })
    fetchAll(); setTogglingId(null)
  }
  const toggleExtra = async (ex: CustomExtra) => {
    setTogglingId(ex.id)
    await fetch('/api/dashboard/custom-extras', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ex.id, available: !ex.available })
    })
    fetchAll(); setTogglingId(null)
  }

  // ── Deletes ──────────────────────────────────────────────────────────────────
  const deleteBouquet = async (id: string) => {
    if (!confirm('Видалити букет?')) return
    setDeletingId(id)
    await fetch(`/api/flowers/${id}`, { method: 'DELETE' })
    fetchAll(); setDeletingId(null)
  }
  const deleteStock = async (id: string) => {
    if (!confirm('Видалити квітку?')) return
    setDeletingId(id)
    await fetch('/api/dashboard/stock-flowers', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchAll(); setDeletingId(null)
  }
  const deleteWrapping = async (id: string) => {
    if (!confirm('Видалити упаковку?')) return
    setDeletingId(id)
    await fetch('/api/dashboard/wrapping', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchAll(); setDeletingId(null)
  }
  const deleteExtra = async (id: string) => {
    if (!confirm('Видалити елемент?')) return
    setDeletingId(id)
    await fetch('/api/dashboard/custom-extras', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchAll(); setDeletingId(null)
  }

  // Is premium? Only true once planInfo is loaded
  const isPremium = !pageLoading && planInfo?.planSlug === 'premium'

  const tabs = [
    { id: 'bouquets' as const, label: 'Букети',      icon: '🌸', count: bouquets.length },
    { id: 'stock'    as const, label: 'Квіти',       icon: '🌷', count: stockFlowers.length, premiumOnly: true },
    { id: 'wrapping' as const, label: 'Упаковка',    icon: '🎁', count: wrapping.length,     premiumOnly: true },
    { id: 'extras'   as const, label: 'Кастом речі', icon: '🎀', count: extras.length,       premiumOnly: true },
  ]

  if (pageLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-9 w-48 bg-gray-200 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="flex gap-2 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Асортимент</h1>
        <p className="text-gray-500 mt-1">Керуйте букетами, квітками, упаковкою та кастом речами</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id}
            onClick={() => { setTab(t.id); setShowForm(false); setError('') }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300'
            }`}>
            {t.icon} {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${tab === t.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {t.count}
            </span>
            {t.premiumOnly && !isPremium && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">PRO</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════ BOUQUETS ══════════ */}
      {tab === 'bouquets' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <SectionHeader icon="🌸" title="Букети" subtitle="Готові букети для продажу у вашому магазині"
            count={bouquets.length} onAdd={() => setShowForm(p => !p)} addLabel="Додати букет" />

          {planInfo && (
            <div className="mb-5 flex items-center gap-3 p-3 bg-purple-50 rounded-xl text-sm">
              <span className="text-purple-600 font-bold">
                {planInfo.current} / {planInfo.max === 999 ? '∞' : planInfo.max} букетів
              </span>
              <div className="flex-1 bg-purple-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (planInfo.current / (planInfo.max === 999 ? Math.max(planInfo.current, 1) : planInfo.max)) * 100)}%` }} />
              </div>
            </div>
          )}

          {showForm && (
            <div className="mb-6 bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">➕ Новий букет</h3>
              <form onSubmit={submitBouquet} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Назва *</label>
                    <input required value={bouquetForm.name}
                      onChange={e => setBouquetForm(p => ({ ...p, name: e.target.value }))}
                      className={inputCls} placeholder="Троянди мікс" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ціна ({currencySymbol}) *</label>
                    <input type="number" required min="0" step="1" value={bouquetForm.price}
                      onChange={e => setBouquetForm(p => ({ ...p, price: e.target.value }))}
                      className={inputCls} placeholder="450" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Дата виготовлення</label>
                    <input type="date" max={today} value={bouquetForm.madeAt}
                      onChange={e => setBouquetForm(p => ({ ...p, madeAt: e.target.value }))}
                      className={inputCls} />
                    {bouquetForm.madeAt && (
                      <p className="text-xs text-pink-600 mt-1">🕐 {getDaysAge(bouquetForm.madeAt)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Наявність</label>
                    <select value={bouquetForm.availability}
                      onChange={e => setBouquetForm(p => ({ ...p, availability: e.target.value }))}
                      className={inputCls}>
                      <option value="in_stock">В наявності</option>
                      <option value="limited">Мало залишилось</option>
                      <option value="out_of_stock">Немає в наявності</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Опис</label>
                  <textarea rows={2} value={bouquetForm.description}
                    onChange={e => setBouquetForm(p => ({ ...p, description: e.target.value }))}
                    className={inputCls} placeholder="Розкажіть про цей букет..." />
                </div>
                <ImageUploadBox
                  imageUrl={bouquetForm.imageUrl}
                  uploading={uploading}
                  onRemove={() => setBouquetForm(p => ({ ...p, imageUrl: '' }))}
                  onUpload={async (file) => {
                    try {
                      const url = await handleUpload(file, 'flower')
                      setBouquetForm(p => ({ ...p, imageUrl: url }))
                    } catch (err: any) { fail(err.message) }
                  }}
                />
                {/* isCustom toggle */}
                <button
                  type="button"
                  onClick={() => setBouquetForm(p => ({ ...p, isCustom: !p.isCustom }))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    bouquetForm.isCustom
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 bg-gray-50 hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{bouquetForm.isCustom ? '🎨' : '🌸'}</span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-800">
                        {bouquetForm.isCustom ? 'Кастомний букет' : 'Звичайний букет'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {bouquetForm.isCustom
                          ? 'Клієнти бачать що це унікальна ручна робота'
                          : 'Готовий букет з фіксованою ціною'}
                      </p>
                    </div>
                  </div>
                  <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    bouquetForm.isCustom ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                      bouquetForm.isCustom ? 'left-6' : 'left-1'
                    }`} />
                  </div>
                </button>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading || uploading}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2.5 rounded-xl font-bold text-sm hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all">
                    {loading ? '⏳ Зберігаємо...' : '🌸 Додати букет'}
                  </button>
                  <button type="button" onClick={resetForm}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Edit form ── */}
          {editingBouquet && (
            <div className="mb-6 bg-blue-50 rounded-2xl p-5 border-2 border-blue-200">
              <h3 className="font-bold text-gray-800 mb-4">✏️ Редагувати: {editingBouquet.name}</h3>
              <form onSubmit={submitEditBouquet} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Назва *</label>
                    <input required value={editForm.name}
                      onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ціна ({currencySymbol}) *</label>
                    <input type="number" required min="0" step="1" value={editForm.price}
                      onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Дата виготовлення</label>
                    <input type="date" max={today} value={editForm.madeAt}
                      onChange={e => setEditForm(p => ({ ...p, madeAt: e.target.value }))}
                      className={inputCls} />
                    {editForm.madeAt && (
                      <p className="text-xs text-pink-600 mt-1">🕐 {getDaysAge(editForm.madeAt)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Наявність</label>
                    <select value={editForm.availability}
                      onChange={e => setEditForm(p => ({ ...p, availability: e.target.value }))}
                      className={inputCls}>
                      <option value="in_stock">В наявності</option>
                      <option value="limited">Мало залишилось</option>
                      <option value="out_of_stock">Немає в наявності</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Опис</label>
                  <textarea rows={2} value={editForm.description}
                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                    className={inputCls} placeholder="Розкажіть про цей букет..." />
                </div>
                <ImageUploadBox
                  imageUrl={editForm.imageUrl}
                  uploading={uploading}
                  onRemove={() => setEditForm(p => ({ ...p, imageUrl: '' }))}
                  onUpload={async (file) => {
                    try {
                      const url = await handleUpload(file, 'flower')
                      setEditForm(p => ({ ...p, imageUrl: url }))
                    } catch (err: any) { fail(err.message) }
                  }}
                />
                {/* isCustom toggle */}
                <button
                  type="button"
                  onClick={() => setEditForm(p => ({ ...p, isCustom: !p.isCustom }))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    editForm.isCustom
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 bg-gray-50 hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{editForm.isCustom ? '🎨' : '🌸'}</span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-800">
                        {editForm.isCustom ? 'Кастомний букет' : 'Звичайний букет'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {editForm.isCustom
                          ? 'Клієнти бачать що це унікальна ручна робота'
                          : 'Готовий букет з фіксованою ціною'}
                      </p>
                    </div>
                  </div>
                  <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    editForm.isCustom ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                      editForm.isCustom ? 'left-6' : 'left-1'
                    }`} />
                  </div>
                </button>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading || uploading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all">
                    {loading ? '⏳ Зберігаємо...' : '💾 Зберегти зміни'}
                  </button>
                  <button type="button" onClick={() => setEditingBouquet(null)}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {bouquets.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">🌸</div>
                <p className="font-medium">Букетів ще немає — додайте перший!</p>
              </div>
            )}
            {bouquets.map(b => {
              const ageStr = getDaysAge(b.madeAt)
              const availColor = b.availability === 'in_stock' ? 'bg-green-100 text-green-700' : b.availability === 'limited' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
              const availLabel = b.availability === 'in_stock' ? 'В наявності' : b.availability === 'limited' ? 'Мало' : 'Немає'
              return (
                <div key={b.id} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-sm transition-all">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {b.imageUrl
                      ? <Image src={b.imageUrl} alt={b.name} width={80} height={80} className="w-full h-full object-cover" />
                      : <span className="text-3xl">🌸</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-gray-900">{b.name}</h3>
                        {b.isCustom && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">🎨 Кастом</span>
                        )}
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${availColor}`}>{availLabel}</span>
                    </div>
                    <p className="text-lg font-black text-pink-600">{currencySymbol}{b.price.toFixed(0)}</p>
                    {b.madeAt && (
                      <p className="text-xs text-purple-500 font-medium mt-0.5">
                        🕐 {ageStr} · {new Date(b.madeAt).toLocaleDateString('uk-UA')}
                      </p>
                    )}
                    {b.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{b.description}</p>}
                    <div className="flex gap-3 mt-2 text-xs">
                      <button onClick={() => startEditBouquet(b)}
                        className="text-purple-600 font-semibold hover:text-purple-700">
                        ✏️ Редагувати
                      </button>
                      <button onClick={() => toggleBouquet(b)} disabled={togglingId === b.id}
                        className="text-blue-600 font-semibold hover:text-blue-700 disabled:opacity-50">
                        {togglingId === b.id ? '⏳' : b.availability === 'in_stock' ? '🚫 Приховати' : '✅ Показати'}
                      </button>
                      <button onClick={() => deleteBouquet(b.id)} disabled={deletingId === b.id}
                        className="text-red-500 font-semibold hover:text-red-600 disabled:opacity-50">
                        {deletingId === b.id ? '⏳' : '🗑️ Видалити'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════ STOCK FLOWERS ══════════ */}
      {tab === 'stock' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {!isPremium ? (
            <PremiumGate feature="Розділ «Квіти для кастому»" />
          ) : (<>
          <SectionHeader icon="🌷" title="Квіти для кастому" subtitle="Стебла квітів для кастомних букетів — клієнт обирає самостійно"
            count={stockFlowers.length} onAdd={() => setShowForm(p => !p)} addLabel="Додати квітку" />

          {showForm && (
            <div className="mb-6 bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">➕ Нова квітка</h3>
              <form onSubmit={submitStock} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Назва *</label>
                    <input required value={stockForm.name}
                      onChange={e => setStockForm(p => ({ ...p, name: e.target.value }))}
                      className={inputCls} placeholder="Троянда" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Колір</label>
                    <input value={stockForm.color}
                      onChange={e => setStockForm(p => ({ ...p, color: e.target.value }))}
                      className={inputCls} placeholder="Червоний" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ціна за стебло ({currencySymbol}) *</label>
                    <input type="number" required min="0" step="0.01" value={stockForm.pricePerStem}
                      onChange={e => setStockForm(p => ({ ...p, pricePerStem: e.target.value }))}
                      className={inputCls} placeholder="15" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Кількість *</label>
                    <input type="number" required min="0" value={stockForm.stockCount}
                      onChange={e => setStockForm(p => ({ ...p, stockCount: e.target.value }))}
                      className={inputCls} placeholder="50" />
                  </div>
                </div>
                <ImageUploadBox
                  imageUrl={stockForm.imageUrl}
                  uploading={uploading}
                  onRemove={() => setStockForm(p => ({ ...p, imageUrl: '' }))}
                  onUpload={async (file) => {
                    try {
                      const url = await handleUpload(file, 'flower')
                      setStockForm(p => ({ ...p, imageUrl: url }))
                    } catch (err: any) { fail(err.message) }
                  }}
                />
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading || uploading}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2.5 rounded-xl font-bold text-sm hover:from-pink-600 hover:to-purple-700 disabled:opacity-50">
                    {loading ? '⏳ Зберігаємо...' : '🌷 Додати квітку'}
                  </button>
                  <button type="button" onClick={resetForm}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold">
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockFlowers.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🌷</div>
                <p>Квітів ще немає — додайте перші</p>
              </div>
            )}
            {stockFlowers.map(sf => (
              <div key={sf.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                {sf.imageUrl && (
                  <div className="relative h-28 rounded-xl overflow-hidden mb-3">
                    <Image src={sf.imageUrl} alt={sf.name} fill className="object-cover" />
                  </div>
                )}
                {!sf.imageUrl && (
                  <div className="h-16 flex items-center justify-center text-3xl mb-2">🌷</div>
                )}
                <h3 className="font-bold text-gray-900">{sf.name}</h3>
                {sf.color && <p className="text-xs text-gray-500 mt-0.5">🎨 {sf.color}</p>}
                <p className="text-base font-black text-pink-600 mt-1">{currencySymbol}{sf.pricePerStem.toFixed(2)} / стебло</p>
                <p className="text-xs text-gray-500">Залишок: <strong>{sf.stockCount}</strong> шт</p>
                <button onClick={() => deleteStock(sf.id)} disabled={deletingId === sf.id}
                  className="mt-2 text-xs text-red-500 hover:text-red-600 font-semibold disabled:opacity-50">
                  {deletingId === sf.id ? '⏳' : '🗑️ Видалити'}
                </button>
              </div>
            ))}
          </div>
          </>
          )}
        </div>
      )}

      {/* ══════════ WRAPPING ══════════ */}
      {tab === 'wrapping' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {!isPremium ? (
            <PremiumGate feature="Розділ «Упаковка»" />
          ) : (<>
          <SectionHeader icon="🎁" title="Упаковка" subtitle="Варіанти обгортання для кастомних букетів"
            count={wrapping.length} onAdd={() => setShowForm(p => !p)} addLabel="Додати упаковку" />

          {showForm && (
            <div className="mb-6 bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">➕ Нова упаковка</h3>
              <form onSubmit={submitWrapping} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Назва *</label>
                    <input required value={wrappingForm.name}
                      onChange={e => setWrappingForm(p => ({ ...p, name: e.target.value }))}
                      className={inputCls} placeholder="Крафт папір" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ціна ({currencySymbol})</label>
                    <input type="number" min="0" step="0.01" value={wrappingForm.price}
                      onChange={e => setWrappingForm(p => ({ ...p, price: e.target.value }))}
                      className={inputCls} placeholder="0 = безкоштовно" />
                  </div>
                </div>
                <ImageUploadBox
                  imageUrl={wrappingForm.imageUrl}
                  uploading={uploading}
                  onRemove={() => setWrappingForm(p => ({ ...p, imageUrl: '' }))}
                  onUpload={async (file) => {
                    try {
                      const url = await handleUpload(file, 'wrapping')
                      setWrappingForm(p => ({ ...p, imageUrl: url }))
                    } catch (err: any) { fail(err.message) }
                  }}
                />
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading || uploading}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2.5 rounded-xl font-bold text-sm hover:from-pink-600 hover:to-purple-700 disabled:opacity-50">
                    {loading ? '⏳ Зберігаємо...' : '🎁 Додати упаковку'}
                  </button>
                  <button type="button" onClick={resetForm}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold">
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wrapping.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🎁</div>
                <p>Упаковок ще немає</p>
              </div>
            )}
            {wrapping.map(w => (
              <div key={w.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                {w.imageUrl && (
                  <div className="relative h-28 rounded-xl overflow-hidden mb-3">
                    <Image src={w.imageUrl} alt={w.name} fill className="object-cover" />
                  </div>
                )}
                {!w.imageUrl && <div className="h-12 flex items-center justify-center text-3xl mb-2">🎁</div>}
                <h3 className="font-bold text-gray-900">{w.name}</h3>
                <p className="text-base font-black text-pink-600 mt-1">
                  {w.price === 0 ? 'Безкоштовно' : `${currencySymbol}${w.price.toFixed(2)}`}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <button onClick={() => toggleWrapping(w)} disabled={togglingId === w.id}
                    className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${w.available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {togglingId === w.id ? '⏳' : w.available ? '✅ Доступно' : 'Недоступно'}
                  </button>
                  <button onClick={() => deleteWrapping(w.id)} disabled={deletingId === w.id}
                    className="text-xs text-red-500 hover:text-red-600 font-semibold disabled:opacity-50">
                    {deletingId === w.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </div>
      )}

      {/* ══════════ CUSTOM EXTRAS (Кастом речі) ══════════ */}
      {tab === 'extras' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {!isPremium ? (
            <PremiumGate feature="Розділ «Кастом речі»" />
          ) : (
            <>
              <SectionHeader icon="🎀" title="Кастом речі" subtitle="Додаткові елементи до кастомного букету — іграшка, вузлик, цукерки тощо"
                count={extras.length} onAdd={() => setShowForm(p => !p)} addLabel="Додати річ" />

              <div className="mb-5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4 text-sm text-purple-800">
                <p className="font-bold mb-1">💡 Що таке Кастом речі?</p>
                <p>Ви самі вирішуєте що це буде — іграшка-ведмедик, тематичний вузлик, цукерки, листівка чи щось особливе. Клієнт бачить ці елементи при складанні кастомного букету і може додати до замовлення.</p>
              </div>

              {showForm && (
                <div className="mb-6 bg-gray-50 rounded-2xl p-5 border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4">➕ Нова кастом річ</h3>
                  <form onSubmit={submitExtra} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Назва *</label>
                        <input required value={extraForm.name}
                          onChange={e => setExtraForm(p => ({ ...p, name: e.target.value }))}
                          className={inputCls} placeholder="напр. Ведмедик Тедді" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Ціна ({currencySymbol})</label>
                        <input type="number" min="0" step="1" value={extraForm.price}
                          onChange={e => setExtraForm(p => ({ ...p, price: e.target.value }))}
                          className={inputCls} placeholder="0 = безкоштовно" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Опис</label>
                      <input value={extraForm.description}
                        onChange={e => setExtraForm(p => ({ ...p, description: e.target.value }))}
                        className={inputCls} placeholder="Маленький плюшевий ведмедик" />
                    </div>
                    <ImageUploadBox
                      imageUrl={extraForm.imageUrl}
                      uploading={uploading}
                      onRemove={() => setExtraForm(p => ({ ...p, imageUrl: '' }))}
                      onUpload={async (file) => {
                        try {
                          const url = await handleUpload(file, 'extra')
                          setExtraForm(p => ({ ...p, imageUrl: url }))
                        } catch (err: any) { fail(err.message) }
                      }}
                    />
                    <div className="flex gap-3 pt-2">
                      <button type="submit" disabled={loading || uploading}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2.5 rounded-xl font-bold text-sm hover:from-pink-600 hover:to-purple-700 disabled:opacity-50">
                        {loading ? '⏳ Зберігаємо...' : '🎀 Додати річ'}
                      </button>
                      <button type="button" onClick={resetForm}
                        className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold">
                        Скасувати
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {extras.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    <div className="text-4xl mb-2">🎀</div>
                    <p>Кастом речей ще немає — додайте першу!</p>
                  </div>
                )}
                {extras.map(ex => (
                  <div key={ex.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    {ex.imageUrl && (
                      <div className="relative h-28 rounded-xl overflow-hidden mb-3">
                        <Image src={ex.imageUrl} alt={ex.name} fill className="object-cover" />
                      </div>
                    )}
                    {!ex.imageUrl && <div className="h-12 flex items-center justify-center text-3xl mb-2">🎀</div>}
                    <h3 className="font-bold text-gray-900">{ex.name}</h3>
                    {ex.description && <p className="text-xs text-gray-500 mt-0.5">{ex.description}</p>}
                    <p className="text-base font-black text-pink-600 mt-1">
                    {ex.price === 0 ? 'Безкоштовно' : `${currencySymbol}${ex.price.toFixed(0)}`}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <button onClick={() => toggleExtra(ex)} disabled={togglingId === ex.id}
                        className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${ex.available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {togglingId === ex.id ? '⏳' : ex.available ? '✅ Активний' : 'Прихований'}
                      </button>
                      <button onClick={() => deleteExtra(ex.id)} disabled={deletingId === ex.id}
                        className="text-xs text-red-500 hover:text-red-600 font-semibold disabled:opacity-50">
                        {deletingId === ex.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
