'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getPlanConfig } from '@/lib/plans'
import { UA_CITIES } from '@/lib/cities'

type Tab = 'general' | 'appearance' | 'contact' | 'hours' | 'delivery' | 'orders' | 'seo' | 'telegram' | 'danger'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Понеділок', tuesday: 'Вівторок', wednesday: 'Середа',
  thursday: 'Четвер', friday: "П'ятниця", saturday: 'Субота', sunday: 'Неділя',
}

type DayHours = { open: string; close: string; closed: boolean }
type WeeklyHours = Record<string, DayHours>

const defaultDayHours: DayHours = { open: '09:00', close: '18:00', closed: false }
const defaultHours: WeeklyHours = Object.fromEntries(
  DAYS.map(d => [d, { ...defaultDayHours, closed: d === 'sunday' }])
)

const COLOR_THEMES = [
  { name: 'Рожевий',     primary: '#ec4899', accent: '#a855f7' },
  { name: 'Червоний',    primary: '#ef4444', accent: '#f97316' },
  { name: 'Помаранч.',   primary: '#f97316', accent: '#eab308' },
  { name: 'Жовтий',     primary: '#eab308', accent: '#84cc16' },
  { name: 'Зелений',    primary: '#22c55e', accent: '#10b981' },
  { name: 'Бірюзовий',  primary: '#14b8a6', accent: '#06b6d4' },
  { name: 'Синій',      primary: '#3b82f6', accent: '#6366f1' },
  { name: 'Фіолетовий', primary: '#8b5cf6', accent: '#ec4899' },
  { name: 'Коричневий', primary: '#92400e', accent: '#d97706' },
  { name: 'Чорний',     primary: '#1f2937', accent: '#4b5563' },
  { name: 'Золотий',    primary: '#b45309', accent: '#d97706' },
  { name: 'Лавандовий', primary: '#7c3aed', accent: '#c084fc' },
]

const CONTACT_FIELDS = [
  { key: 'phoneNumber',     showKey: 'showPhone',     icon: '📞', label: 'Телефон',   type: 'tel',   prefix: null, placeholder: '+380 99 123 4567' },
  { key: 'email',           showKey: 'showEmail',     icon: '✉️',  label: 'Email',     type: 'email', prefix: null, placeholder: 'hello@shop.com' },
  { key: 'whatsappNumber',  showKey: 'showWhatsapp',  icon: '💬', label: 'WhatsApp',  type: 'tel',   prefix: null, placeholder: '+380991234567' },
  { key: 'telegramHandle',  showKey: 'showTelegram',  icon: '✈️',  label: 'Telegram',  type: 'text',  prefix: '@',  placeholder: 'yourshop' },
  { key: 'instagramHandle', showKey: 'showInstagram', icon: '📸', label: 'Instagram', type: 'text',  prefix: '@',  placeholder: 'yourshop' },
] as const

const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition-all'

function PlanLockBanner({ feature, requiredPlan }: { feature: string; requiredPlan: 'basic' | 'premium' }) {
  const label = requiredPlan === 'basic' ? 'Базовий або Преміум' : 'Преміум'
  const price  = requiredPlan === 'basic' ? '900 грн/міс' : '2000 грн/міс'
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <span className="text-xl">🔒</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-amber-900">{feature} — план «{label}»</p>
        <p className="text-xs text-amber-700 mt-0.5 mb-2">Перейдіть на платний план щоб розблокувати цю функцію.</p>
        <Link href="/dashboard/subscription"
          className="inline-flex items-center gap-1 text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors">
          Перейти на {label} — {price}
        </Link>
      </div>
    </div>
  )
}

function DeliveryCitiesSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? value.split(',').map(c => c.trim()).filter(Boolean) : []
  const toggle = (city: string) => {
    const next = selected.includes(city) ? selected.filter(c => c !== city) : [...selected, city]
    onChange(next.join(', '))
  }
  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map(city => (
            <span key={city} className="flex items-center gap-1.5 bg-pink-100 text-pink-800 text-xs font-bold px-3 py-1.5 rounded-full">
              📍 {city}
              <button type="button" onClick={() => toggle(city)} className="ml-0.5 text-pink-400 hover:text-pink-700 font-black leading-none">×</button>
            </span>
          ))}
          <button type="button" onClick={() => onChange('')}
            className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg transition-colors">
            Очистити все
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {UA_CITIES.map(city => {
          const active = selected.includes(city)
          return (
            <button key={city} type="button" onClick={() => toggle(city)}
              className={`text-left text-xs px-3 py-2 rounded-xl border-2 font-medium transition-all ${
                active ? 'border-pink-400 bg-pink-50 text-pink-800' : 'border-gray-200 bg-white text-gray-600 hover:border-pink-300'
              }`}>
              {active ? '✓ ' : ''}{city}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [planSlug, setPlanSlug] = useState<string>('free')

  const [telegramChatId, setTelegramChatId] = useState('')
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [telegramMsg, setTelegramMsg] = useState('')
  const [telegramError, setTelegramError] = useState('')

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<'cover' | 'logo' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const coverInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [shopData, setShopData] = useState({
    name: '', about: '', language: 'uk', currency: 'UAH', timezone: 'Europe/Kyiv',
    coverImageUrl: '', logoUrl: '',
    primaryColor: '#ec4899', accentColor: '#a855f7', enableAnimations: true, layoutStyle: 'classic',
    location: '', city: '', country: '', googleMapsUrl: '',
    email: '', phoneNumber: '', whatsappNumber: '', telegramHandle: '', instagramHandle: '',
    showPhone: true, showEmail: true, showWhatsapp: true, showTelegram: true, showInstagram: true, showLocation: true,
    sameDayDelivery: true, deliveryTimeEstimate: '', deliveryCutoffTime: '14:00',
    minimumOrderAmount: 0, autoConfirmOrders: false, requirePhoneVerify: false,
    showDeliveryEstimate: true, allowSameDayOrders: true, allowCustomBouquet: true,
    // Order settings
    orderNotifyEmail: '', orderNotifyEmailEnabled: false,
    requireCustomerEmail: false, showOrderTracking: true,
    // SEO
    seoTitle: '', seoDescription: '', seoKeywords: '',
  })

  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>(defaultHours)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const plan = getPlanConfig(planSlug)
  const canCoverPhoto   = plan.allowCoverPhoto
  const canLogoUpload   = plan.allowLogoUpload
  const canCustomColors = plan.allowCustomColors
  const canTelegram     = plan.allowTelegram

  useEffect(() => { fetchShopData() }, [])

  const fetchShopData = async () => {
    try {
      const res = await fetch('/api/shop')
      const data = await res.json()
      if (data.shop) {
        const s = data.shop
        setPlanSlug(s.plan?.slug || 'free')
        setShopData(prev => ({
          ...prev,
          name: s.name || '', about: s.about || '',
          language: s.language || 'uk', currency: s.currency || 'UAH', timezone: s.timezone || 'Europe/Kyiv',
          coverImageUrl: s.coverImageUrl || '', logoUrl: s.logoUrl || '',
          primaryColor: s.primaryColor || '#ec4899', accentColor: s.accentColor || '#a855f7',
          enableAnimations: s.enableAnimations ?? true, layoutStyle: s.layoutStyle || 'classic',
          location: s.location || '', city: s.city || '', country: s.country || '',
          googleMapsUrl: s.googleMapsUrl || '', email: s.email || '',
          phoneNumber: s.phoneNumber || '', whatsappNumber: s.whatsappNumber || '',
          telegramHandle: s.telegramHandle || '', instagramHandle: s.instagramHandle || '',
          showPhone: s.showPhone ?? true, showEmail: s.showEmail ?? true,
          showWhatsapp: s.showWhatsapp ?? true, showTelegram: s.showTelegram ?? true,
          showInstagram: s.showInstagram ?? true, showLocation: s.showLocation ?? true,
          sameDayDelivery: s.sameDayDelivery ?? true,
          deliveryTimeEstimate: s.deliveryTimeEstimate || '',
          deliveryCutoffTime: s.deliveryCutoffTime || '14:00',
          minimumOrderAmount: s.minimumOrderAmount ?? 0,
          autoConfirmOrders: s.autoConfirmOrders ?? false,
          requirePhoneVerify: s.requirePhoneVerify ?? false,
          showDeliveryEstimate: s.showDeliveryEstimate ?? true,
          allowSameDayOrders: s.allowSameDayOrders ?? true,
          allowCustomBouquet: s.allowCustomBouquet ?? true,
          orderNotifyEmail: s.orderNotifyEmail || s.email || '',
          orderNotifyEmailEnabled: s.orderNotifyEmailEnabled ?? false,
          requireCustomerEmail: s.requireCustomerEmail ?? false,
          showOrderTracking: s.showOrderTracking ?? true,
          seoTitle: s.seoTitle || '',
          seoDescription: s.seoDescription || '',
          seoKeywords: s.seoKeywords || '',
        }))
        if (s.coverImageUrl) setCoverPreview(s.coverImageUrl)
        if (s.logoUrl) setLogoPreview(s.logoUrl)
        if (s.telegramChatId) { setTelegramChatId(s.telegramChatId); setTelegramConnected(true) }
        if (s.workingHours) {
          try { setWeeklyHours({ ...defaultHours, ...JSON.parse(s.workingHours) }) } catch {}
        }
      }
    } catch {}
  }

  const handleFileUpload = async (file: File, type: 'cover' | 'logo') => {
    if (file.size > 5 * 1024 * 1024) { setError('Файл занадто великий. Макс. 5MB.'); return }
    if (!file.type.startsWith('image/')) { setError('Будь ласка, оберіть зображення.'); return }
    setUploading(type); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('type', type)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      const urlKey = type === 'cover' ? 'coverImageUrl' : 'logoUrl'
      const updated = { ...shopData, [urlKey]: data.url }
      await fetch('/api/shop', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updated, workingHours: JSON.stringify(weeklyHours) }),
      })
      if (type === 'cover') { setShopData(p => ({ ...p, coverImageUrl: data.url })); setCoverPreview(data.url) }
      else { setShopData(p => ({ ...p, logoUrl: data.url })); setLogoPreview(data.url) }
      notify('✅ Фото збережено!')
    } catch (err: any) { setError(err.message) }
    finally { setUploading(null) }
  }

  const notify = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/shop', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...shopData, workingHours: JSON.stringify(weeklyHours) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update shop')
      notify('✅ Налаштування збережено!')
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const set = (key: string, value: any) => setShopData(p => ({ ...p, [key]: value }))

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDeleteShop = async () => {
    if (deleteConfirm !== 'ВИДАЛИТИ') return
    setDeleteLoading(true); setDeleteError('')
    try {
      const res = await fetch('/api/shop', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = '/api/auth/signout?callbackUrl=/'
    } catch (err: any) {
      setDeleteError(err.message)
      setDeleteLoading(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: string; badge?: string }[] = [
    { id: 'general',    label: 'Загальне',       icon: '🏪' },
    { id: 'appearance', label: 'Дизайн',          icon: '🎨' },
    { id: 'contact',    label: 'Контакти',        icon: '📞' },
    { id: 'hours',      label: 'Години роботи',   icon: '🕐' },
    { id: 'delivery',   label: 'Доставка',        icon: '🚚' },
    { id: 'orders',     label: 'Замовлення',      icon: '📦' },
    { id: 'seo',        label: 'SEO',             icon: '🔍' },
    { id: 'telegram',   label: 'Telegram',        icon: '✈️', badge: canTelegram ? undefined : 'PRO' },
    { id: 'danger',     label: 'Небезпека',       icon: '⚠️' },
  ]

  const seoTitlePreview = shopData.seoTitle || `${shopData.name} — квіти та букети`
  const seoDescPreview  = shopData.seoDescription || (shopData.about ? shopData.about.slice(0, 155) : `Замовте свіжі букети онлайн у ${shopData.name}.`)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Налаштування магазину</h1>
          <p className="text-gray-500 text-sm mt-1">Повністю налаштуйте вигляд та роботу вашого магазину</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
            <span>✅</span> {success}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto">
              {tabs.map(tab => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap w-full text-left ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  <span className="text-base">{tab.icon}</span>
                  <span className="flex-1">{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">

                {/* ══ GENERAL ══ */}
                {activeTab === 'general' && (
                  <>
                    <SectionTitle icon="🏪" title="Загальна інформація" subtitle="Основні дані магазину для клієнтів" />
                    <Field label="Назва магазину" hint="Відображається як основний заголовок на сторінці магазину">
                      <input type="text" required value={shopData.name} onChange={e => set('name', e.target.value)}
                        className={inputCls} placeholder="Квіти від Марії" />
                    </Field>
                    <Field label="Про магазин" hint="Розкажіть клієнтам що робить вас особливими">
                      <textarea rows={5} value={shopData.about} onChange={e => set('about', e.target.value)}
                        className={inputCls} placeholder="Ми створюємо букети з любов'ю..." />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Мова">
                        <select value={shopData.language} onChange={e => set('language', e.target.value)} className={inputCls}>
                          <option value="uk">🇺🇦 Українська</option>
                          <option value="en">🇺🇸 English</option>
                          <option value="de">🇩🇪 Deutsch</option>
                          <option value="pl">🇵🇱 Polski</option>
                        </select>
                      </Field>
                      <Field label="Валюта">
                        <select value={shopData.currency} onChange={e => set('currency', e.target.value)} className={inputCls}>
                          <option value="UAH">🇺🇦 UAH – Гривня</option>
                          <option value="USD">💵 USD – Долар</option>
                          <option value="EUR">💶 EUR – Євро</option>
                          <option value="GBP">💷 GBP – Фунт</option>
                          <option value="PLN">🇵🇱 PLN – Злотий</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="Часовий пояс">
                      <select value={shopData.timezone} onChange={e => set('timezone', e.target.value)} className={inputCls}>
                        <option value="Europe/Kyiv">🇺🇦 Europe/Kyiv (UTC+2/+3)</option>
                        <option value="Europe/Warsaw">🇵🇱 Europe/Warsaw</option>
                        <option value="Europe/Berlin">🇩🇪 Europe/Berlin</option>
                        <option value="UTC">🌍 UTC</option>
                      </select>
                    </Field>
                    <Field label="📍 Місто магазину" hint="Клієнти зможуть знайти ваш магазин у каталозі по місту">
                      <select value={shopData.city} onChange={e => set('city', e.target.value)} className={inputCls}>
                        <option value="">Оберіть місто...</option>
                        {UA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {shopData.city && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                          <span>✅</span>
                          <span>Ваш магазин видно у каталозі для міста <strong>{shopData.city}</strong></span>
                          <a href="/shops" target="_blank" className="ml-auto font-bold underline hover:text-green-900">Каталог →</a>
                        </div>
                      )}
                    </Field>
                    <Toggle label="Власний букет на замовлення" hint="Клієнти зможуть скласти власний букет з вашого асортименту"
                      checked={shopData.allowCustomBouquet} onChange={v => set('allowCustomBouquet', v)} />
                  </>
                )}

                {/* ══ APPEARANCE ══ */}
                {activeTab === 'appearance' && (
                  <>
                    <SectionTitle icon="🎨" title="Зовнішній вигляд" subtitle="Налаштуйте дизайн вашої публічної сторінки" />

                    {canCoverPhoto ? (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Фото обкладинки</p>
                        <p className="text-xs text-gray-400 mb-3">Рекомендовано: 1920×600px, до 5MB</p>
                        {coverPreview ? (
                          <div className="relative h-48 rounded-2xl overflow-hidden border border-gray-200 group">
                            <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button type="button" onClick={() => coverInputRef.current?.click()}
                                className="bg-white text-gray-800 px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-gray-100">🔄 Змінити</button>
                              <button type="button" onClick={() => { setCoverPreview(null); set('coverImageUrl', '') }}
                                className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-red-600">🗑 Видалити</button>
                            </div>
                          </div>
                        ) : (
                          <div onClick={() => uploading !== 'cover' && coverInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-pink-400 hover:bg-pink-50/50 transition-all cursor-pointer">
                            {uploading === 'cover' ? (
                              <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
                                <p className="text-sm text-gray-500">Завантажуємо...</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 pointer-events-none">
                                <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center text-2xl mb-1">🖼️</div>
                                <p className="text-sm font-semibold text-gray-700">Натисніть щоб завантажити фото обкладинки</p>
                                <p className="text-xs text-gray-400">PNG, JPG, WebP — до 5MB</p>
                              </div>
                            )}
                          </div>
                        )}
                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'cover'); e.target.value = '' }} />
                      </div>
                    ) : <PlanLockBanner feature="Фото обкладинки" requiredPlan="basic" />}

                    {canLogoUpload ? (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Логотип магазину</p>
                        <p className="text-xs text-gray-400 mb-3">Квадратне зображення, мін. 200×200px</p>
                        <div className="flex items-center gap-5">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200 flex-shrink-0 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                            {logoPreview
                              ? <Image src={logoPreview} alt="Logo" width={96} height={96} className="object-cover w-full h-full" />
                              : <span className="text-3xl font-bold text-pink-400">{shopData.name.charAt(0) || '🌸'}</span>
                            }
                          </div>
                          <div className="flex flex-col gap-2">
                            <button type="button" onClick={() => logoInputRef.current?.click()}
                              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors">
                              {uploading === 'logo' ? '⏳ Завантаження...' : '📁 Завантажити логотип'}
                            </button>
                            {logoPreview && (
                              <button type="button" onClick={() => { setLogoPreview(null); set('logoUrl', '') }}
                                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors">
                                🗑 Видалити
                              </button>
                            )}
                          </div>
                          <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'logo'); e.target.value = '' }} />
                        </div>
                      </div>
                    ) : <PlanLockBanner feature="Власний логотип магазину" requiredPlan="premium" />}

                    {canCustomColors
                      ? <ColorThemePicker primaryColor={shopData.primaryColor} accentColor={shopData.accentColor} shopName={shopData.name}
                          onChangePrimary={v => set('primaryColor', v)} onChangeAccent={v => set('accentColor', v)} />
                      : <PlanLockBanner feature="Кастомні кольори та тема бренду" requiredPlan="premium" />
                    }

                    <Field label="Стиль каталогу" hint="Як відображаються картки букетів для клієнтів">
                      <select value={shopData.layoutStyle} onChange={e => set('layoutStyle', e.target.value)} className={inputCls}>
                        <option value="classic">Класичний — сітка з картками (рекомендовано)</option>
                        <option value="modern">Сучасний — 2 колонки, більші фото</option>
                        <option value="list">Список — компактний вигляд</option>
                        <option value="bold">Повноекранний — великі банери</option>
                      </select>
                    </Field>
                    <Toggle label="Увімкнути анімації" hint="Плавні ефекти при наведенні та переходи"
                      checked={shopData.enableAnimations} onChange={v => set('enableAnimations', v)} />
                  </>
                )}

                {/* ══ CONTACT ══ */}
                {activeTab === 'contact' && (
                  <>
                    <SectionTitle icon="📞" title="Контакти" subtitle="Вмикайте перемикач щоб показати контакт на сторінці магазину" />
                    <ContactCard icon="📍" label="Адреса" isVisible={shopData.showLocation}
                      onToggle={v => set('showLocation', v)} hasValue={!!(shopData.location || shopData.city)}>
                      <div className="space-y-2">
                        <input type="text" value={shopData.location} onChange={e => set('location', e.target.value)}
                          disabled={!shopData.showLocation} className={`${inputCls} ${!shopData.showLocation ? 'opacity-40 cursor-not-allowed' : ''}`}
                          placeholder="вул. Хрещатик 1" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={shopData.city} onChange={e => set('city', e.target.value)}
                            disabled={!shopData.showLocation} className={`${inputCls} ${!shopData.showLocation ? 'opacity-40 cursor-not-allowed' : ''}`}
                            placeholder="Місто" />
                          <input type="text" value={shopData.country} onChange={e => set('country', e.target.value)}
                            disabled={!shopData.showLocation} className={`${inputCls} ${!shopData.showLocation ? 'opacity-40 cursor-not-allowed' : ''}`}
                            placeholder="Країна" />
                        </div>
                        <input type="url" value={shopData.googleMapsUrl} onChange={e => set('googleMapsUrl', e.target.value)}
                          disabled={!shopData.showLocation} className={`${inputCls} ${!shopData.showLocation ? 'opacity-40 cursor-not-allowed' : ''}`}
                          placeholder="Google Maps URL (необов'язково)" />
                      </div>
                    </ContactCard>
                    {CONTACT_FIELDS.map(({ key, showKey, icon, label, type, prefix, placeholder }) => {
                      const isVisible = (shopData as any)[showKey] as boolean
                      const value = (shopData as any)[key] as string
                      return (
                        <ContactCard key={key} icon={icon} label={label} isVisible={isVisible}
                          onToggle={v => set(showKey, v)} hasValue={!!value}>
                          <div className="relative">
                            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-400 select-none">{prefix}</span>}
                            <input type={type} value={value} onChange={e => set(key, e.target.value)}
                              disabled={!isVisible} placeholder={placeholder}
                              className={`${inputCls} ${prefix ? 'pl-8' : ''} ${!isVisible ? 'opacity-40 cursor-not-allowed' : ''}`} />
                          </div>
                        </ContactCard>
                      )
                    })}
                  </>
                )}

                {/* ══ HOURS ══ */}
                {activeTab === 'hours' && (
                  <>
                    <SectionTitle icon="🕐" title="Години роботи" subtitle="Розклад на кожен день тижня" />
                    <div className="space-y-3">
                      {DAYS.map(day => {
                        const hours = weeklyHours[day] || defaultDayHours
                        return (
                          <div key={day} className={`flex items-center gap-4 p-4 rounded-xl border ${hours.closed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
                            <div className="w-28 flex-shrink-0">
                              <span className={`font-semibold text-sm ${hours.closed ? 'text-gray-400' : 'text-gray-700'}`}>{DAY_LABELS[day]}</span>
                            </div>
                            {hours.closed ? (
                              <div className="flex-1 text-sm text-gray-400 italic">Зачинено</div>
                            ) : (
                              <div className="flex items-center gap-3 flex-1 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-gray-500">Відкр.</span>
                                  <input type="time" value={hours.open}
                                    onChange={e => setWeeklyHours(p => ({ ...p, [day]: { ...p[day], open: e.target.value } }))}
                                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-pink-400 focus:outline-none" />
                                </div>
                                <span className="text-gray-400">—</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-gray-500">Закр.</span>
                                  <input type="time" value={hours.close}
                                    onChange={e => setWeeklyHours(p => ({ ...p, [day]: { ...p[day], close: e.target.value } }))}
                                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-pink-400 focus:outline-none" />
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button type="button"
                                onClick={() => setWeeklyHours(p => ({ ...p, [day]: { ...p[day], closed: !hours.closed } }))}
                                className={`relative w-10 h-5 rounded-full transition-colors ${hours.closed ? 'bg-gray-300' : 'bg-green-500'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hours.closed ? 'left-0.5' : 'left-5'}`} />
                              </button>
                              <span className="text-xs text-gray-400 w-12">{hours.closed ? 'Зачин.' : 'Відкр.'}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button type="button"
                        onClick={() => setWeeklyHours(Object.fromEntries(DAYS.map(d => [d, { open: '09:00', close: '18:00', closed: false }])))}
                        className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                        Всі відкриті (9–18)
                      </button>
                      <button type="button"
                        onClick={() => setWeeklyHours(p => ({ ...p, saturday: { ...p.saturday, closed: true }, sunday: { ...p.sunday, closed: true } }))}
                        className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                        Закрити вихідні
                      </button>
                      <button type="button"
                        onClick={() => setWeeklyHours(Object.fromEntries(DAYS.map(d => [d, { open: '10:00', close: '20:00', closed: false }])))}
                        className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                        Всі відкриті (10–20)
                      </button>
                    </div>
                  </>
                )}

                {/* ══ DELIVERY ══ */}
                {activeTab === 'delivery' && (
                  <>
                    <SectionTitle icon="🚚" title="Налаштування доставки" subtitle="Міста доставки та умови замовлень" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">📍 Міста доставки</p>
                      <p className="text-xs text-gray-400 mb-3">Оберіть міста, в які ви доставляєте.</p>
                      <DeliveryCitiesSelector value={shopData.deliveryTimeEstimate} onChange={v => set('deliveryTimeEstimate', v)} />
                    </div>
                    <hr className="border-gray-100" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Час прийому замовлень" hint="Замовлення після цього часу — наступного дня">
                        <input type="time" value={shopData.deliveryCutoffTime}
                          onChange={e => set('deliveryCutoffTime', e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="Мінімальна сума замовлення" hint="0 = без мінімуму">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                            {shopData.currency === 'UAH' ? '₴' : shopData.currency === 'EUR' ? '€' : '$'}
                          </span>
                          <input type="number" min="0" step="1" value={shopData.minimumOrderAmount}
                            onChange={e => set('minimumOrderAmount', parseFloat(e.target.value) || 0)}
                            className={`${inputCls} pl-8`} />
                        </div>
                      </Field>
                    </div>
                    <div className="space-y-3">
                      <Toggle label="Доставка в той самий день" hint="Клієнти можуть отримати замовлення сьогодні"
                        checked={shopData.sameDayDelivery} onChange={v => set('sameDayDelivery', v)} />
                      <Toggle label="Дозволити замовлення на сьогодні"
                        checked={shopData.allowSameDayOrders} onChange={v => set('allowSameDayOrders', v)} />
                      <Toggle label="Показувати час доставки"
                        checked={shopData.showDeliveryEstimate} onChange={v => set('showDeliveryEstimate', v)} />
                    </div>
                  </>
                )}

                {/* ══ ORDERS ══ */}
                {activeTab === 'orders' && (
                  <>
                    <SectionTitle icon="📦" title="Налаштування замовлень" subtitle="Як обробляються замовлення у вашому магазині" />

                    <div className="space-y-3">
                      <Toggle label="Автоматичне підтвердження замовлень"
                        hint="Замовлення підтверджуються без вашого схвалення автоматично"
                        checked={shopData.autoConfirmOrders} onChange={v => set('autoConfirmOrders', v)} />
                      <Toggle label="Вимагати email клієнта"
                        hint="Клієнти повинні вказати email при оформленні замовлення"
                        checked={shopData.requireCustomerEmail} onChange={v => set('requireCustomerEmail', v)} />
                      <Toggle label="Показувати відстеження замовлення"
                        hint="Клієнти можуть перевірити статус свого замовлення за номером телефону"
                        checked={shopData.showOrderTracking} onChange={v => set('showOrderTracking', v)} />
                    </div>

                    <hr className="border-gray-100" />

                    <div>
                      <SectionTitle icon="📧" title="Сповіщення на Email" subtitle="Отримуйте сповіщення про нові замовлення на пошту" />
                      <div className="mt-4 space-y-4">
                        <Toggle label="Сповіщення про нові замовлення на Email"
                          hint="Отримуйте лист кожного разу коли надходить нове замовлення"
                          checked={shopData.orderNotifyEmailEnabled} onChange={v => set('orderNotifyEmailEnabled', v)} />
                        {shopData.orderNotifyEmailEnabled && (
                          <Field label="Email для сповіщень" hint="На цю адресу будуть надходити повідомлення про замовлення">
                            <input type="email" value={shopData.orderNotifyEmail}
                              onChange={e => set('orderNotifyEmail', e.target.value)}
                              className={inputCls} placeholder="orders@yourshop.com" />
                          </Field>
                        )}
                      </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div>
                      <SectionTitle icon="📋" title="Шаблон підтвердження" subtitle="Повідомлення яке бачить клієнт після оформлення замовлення" />
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2">ПОТОЧНИЙ ШАБЛОН</p>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p>✅ <strong>Замовлення прийнято!</strong></p>
                          <p className="text-gray-500">Ми зателефонуємо вам для підтвердження.</p>
                        </div>
                        <p className="mt-3 text-xs text-gray-400">Кастомний шаблон підтвердження — незабаром</p>
                      </div>
                    </div>
                  </>
                )}

                {/* ══ SEO ══ */}
                {activeTab === 'seo' && (
                  <>
                    <SectionTitle icon="🔍" title="SEO та соціальні мережі" subtitle="Налаштуйте як ваш магазин відображається у пошукових системах" />

                    <Field label="SEO-заголовок" hint="Відображається у вкладці браузера та результатах пошуку (макс. 60 символів)">
                      <input type="text" value={shopData.seoTitle} onChange={e => set('seoTitle', e.target.value)}
                        maxLength={60} className={inputCls} placeholder={`${shopData.name} — квіти та букети`} />
                      <div className="flex justify-end mt-1">
                        <span className={`text-xs ${shopData.seoTitle.length > 55 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {shopData.seoTitle.length}/60
                        </span>
                      </div>
                    </Field>

                    <Field label="SEO-опис" hint="Короткий опис у результатах пошуку (макс. 155 символів)">
                      <textarea rows={3} value={shopData.seoDescription} onChange={e => set('seoDescription', e.target.value)}
                        maxLength={155} className={inputCls} placeholder="Замовте свіжі квіти та букети онлайн..." />
                      <div className="flex justify-end mt-1">
                        <span className={`text-xs ${shopData.seoDescription.length > 145 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {shopData.seoDescription.length}/155
                        </span>
                      </div>
                    </Field>

                    <Field label="Ключові слова" hint="Через кому. Допомагають пошуковикам зрозуміти тематику вашого магазину">
                      <input type="text" value={shopData.seoKeywords} onChange={e => set('seoKeywords', e.target.value)}
                        className={inputCls} placeholder="квіти Київ, букети доставка, троянди на замовлення" />
                    </Field>

                    {/* Google preview */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Попередній перегляд у Google</p>
                      <div className="border border-gray-200 rounded-2xl p-5 bg-white">
                        <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Результат пошуку</p>
                        <div className="space-y-1">
                          <p className="text-[#1a0dab] text-lg hover:underline cursor-pointer leading-tight">
                            {seoTitlePreview || 'Заголовок магазину'}
                          </p>
                          <p className="text-xs text-[#006621]">flowergoua.com/{shopData.name.toLowerCase().replace(/\s+/g, '-') || 'your-shop'}</p>
                          <p className="text-sm text-[#545454] leading-relaxed">{seoDescPreview || 'Опис магазину...'}</p>
                        </div>
                      </div>
                    </div>

                    {/* OG preview */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Превью в соціальних мережах</p>
                      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                        <div className="h-32 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
                          {shopData.coverImageUrl
                            ? <Image src={shopData.coverImageUrl} alt="" fill className="object-cover" />
                            : <span className="text-5xl opacity-30">🌸</span>
                          }
                        </div>
                        <div className="px-4 py-3 border-t border-gray-100">
                          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">flowergoua.com</p>
                          <p className="text-sm font-semibold text-gray-900 leading-snug">{seoTitlePreview}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{seoDescPreview}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ══ TELEGRAM ══ */}
                {activeTab === 'telegram' && (
                  <div className="space-y-6">
                    <SectionTitle icon="✈️" title="Telegram сповіщення" subtitle="Отримуйте замовлення і керуйте ними прямо в Telegram" />
                    {!canTelegram ? (
                      <PlanLockBanner feature="Telegram сповіщення про замовлення" requiredPlan="basic" />
                    ) : (
                      <>
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 text-sm text-blue-800 space-y-3">
                          <p className="font-bold text-base">📱 Як підключити — 4 кроки:</p>
                          <div className="space-y-2.5">
                            {[
                              { n: '1', text: <>Відкрийте Telegram і знайдіть бота <a href="https://t.me/flower12go_bot" target="_blank" className="font-bold underline">@flower12go_bot</a></> },
                              { n: '2', text: <>Натисніть кнопку <strong>▶ Start</strong></> },
                              { n: '3', text: <>Введіть команду <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">/getchatid</code></> },
                              { n: '4', text: 'Скопіюйте число і вставте нижче' },
                            ].map(({ n, text }) => (
                              <div key={n} className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-blue-200 text-blue-900 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">{n}</span>
                                <span className="text-blue-700 leading-snug">{text}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {telegramConnected ? (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-green-800">✅ Telegram підключено!</p>
                              <p className="text-sm text-green-600 mt-0.5">Chat ID: <code className="bg-green-100 px-1.5 py-0.5 rounded font-mono">{telegramChatId}</code></p>
                            </div>
                            <button type="button" onClick={async () => {
                              setTelegramLoading(true); setTelegramError(''); setTelegramMsg('')
                              try {
                                await fetch('/api/telegram/connect', { method: 'DELETE' })
                                setTelegramConnected(false); setTelegramChatId('')
                                setTelegramMsg('Telegram відключено.')
                              } catch { setTelegramError('Помилка відключення') }
                              finally { setTelegramLoading(false) }
                            }} disabled={telegramLoading}
                              className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors">
                              Відключити
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Field label="Ваш Telegram Chat ID">
                              <input type="text" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)}
                                className={`${inputCls} font-mono`} placeholder="наприклад: 123456789" />
                            </Field>
                            <button type="button" onClick={async () => {
                              if (!telegramChatId.trim()) { setTelegramError('Введіть Chat ID'); return }
                              setTelegramLoading(true); setTelegramError(''); setTelegramMsg('')
                              try {
                                const res = await fetch('/api/telegram/connect', {
                                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ chatId: telegramChatId.trim() }),
                                })
                                const data = await res.json()
                                if (!res.ok) throw new Error(data.error)
                                setTelegramConnected(true); setTelegramMsg(data.message)
                              } catch (err: any) { setTelegramError(err.message) }
                              finally { setTelegramLoading(false) }
                            }} disabled={telegramLoading || !telegramChatId.trim()}
                              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                              {telegramLoading ? 'Підключаємо...' : '🔗 Підключити Telegram'}
                            </button>
                          </div>
                        )}
                        {telegramMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{telegramMsg}</div>}
                        {telegramError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{telegramError}</div>}
                      </>
                    )}
                  </div>
                )}

                {/* ══ DANGER ══ */}
                {activeTab === 'danger' && (
                  <div className="space-y-6">
                    <SectionTitle icon="⚠️" title="Небезпечна зона" subtitle="Ці дії необоротні і не можуть бути скасовані" />
                    <div className="border-2 border-red-200 rounded-2xl p-6 bg-red-50">
                      <h3 className="text-base font-bold text-red-800 mb-1">🚫 Видалити магазин</h3>
                      <p className="text-sm text-red-700 mb-4 leading-relaxed">
                        Це постійно видалить ваш магазин, усі букети, замовлення та ваш акаунт — безповоротньо.
                      </p>
                      <p className="text-sm font-semibold text-red-800 mb-2">Напишіть «ВИДАЛИТИ» для підтвердження:</p>
                      <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                        placeholder="ВИДАЛИТИ"
                        className="w-full border-2 border-red-300 rounded-xl px-4 py-2.5 text-sm font-mono mb-3 focus:border-red-500 outline-none bg-white" />
                      {deleteError && <p className="text-sm text-red-700 bg-red-100 px-3 py-2 rounded-lg mb-3">{deleteError}</p>}
                      <button type="button" onClick={handleDeleteShop}
                        disabled={deleteConfirm !== 'ВИДАЛИТИ' || deleteLoading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition-colors">
                        {deleteLoading ? 'Видаляємо...' : '🗑️ Назавжди видалити магазин та акаунт'}
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Save bar */}
              {activeTab !== 'danger' && (
                <div className="mt-4 flex items-center gap-4 bg-white rounded-2xl shadow-sm px-6 py-4">
                  <button type="submit" disabled={loading || uploading !== null}
                    className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md text-sm">
                    {loading ? 'Зберігаємо...' : '💾 Зберегти зміни'}
                  </button>
                  <button type="button" onClick={fetchShopData} disabled={loading}
                    className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm">
                    Скинути
                  </button>
                  <p className="text-sm text-gray-400 ml-auto hidden sm:block">Зміни застосовуються одразу</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 pb-2 border-b border-gray-100">
      <div className="w-9 h-9 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div>
        <div className="text-sm font-semibold text-gray-700">{label}</div>
        {hint && <div className="text-xs text-gray-400 mt-0.5">{hint}</div>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${checked ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  )
}

function ContactCard({ icon, label, isVisible, onToggle, hasValue, children }: {
  icon: string; label: string; isVisible: boolean
  onToggle: (v: boolean) => void; hasValue: boolean; children: React.ReactNode
}) {
  return (
    <div className={`rounded-2xl border-2 transition-all overflow-hidden ${isVisible ? 'border-gray-200' : 'border-gray-100 bg-gray-50/50'}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-gray-800 text-sm">{label}</span>
          {isVisible && hasValue
            ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">показується</span>
            : !isVisible
            ? <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">приховано</span>
            : null}
        </div>
        <button type="button" onClick={() => onToggle(!isVisible)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isVisible ? 'bg-green-500' : 'bg-gray-300'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${isVisible ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  )
}

function ColorThemePicker({ primaryColor, accentColor, shopName, onChangePrimary, onChangeAccent }: {
  primaryColor: string; accentColor: string; shopName: string
  onChangePrimary: (v: string) => void; onChangeAccent: (v: string) => void
}) {
  const [tab, setTab] = useState<'presets' | 'custom'>('presets')
  const selectedPreset = COLOR_THEMES.find(
    t => t.primary.toLowerCase() === primaryColor.toLowerCase() &&
         t.accent.toLowerCase() === accentColor.toLowerCase()
  )
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-1">Колірна тема</p>
      <p className="text-xs text-gray-400 mb-3">Кольори кнопок, значків і градієнтів вашого магазину</p>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
        {(['presets', 'custom'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'presets' ? '🎨 Готові теми' : '✏️ Свій колір'}
          </button>
        ))}
      </div>
      {tab === 'presets' && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {COLOR_THEMES.map(theme => {
            const isActive = selectedPreset?.name === theme.name
            return (
              <button key={theme.name} type="button"
                onClick={() => { onChangePrimary(theme.primary); onChangeAccent(theme.accent) }}
                className={`flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all ${isActive ? 'border-gray-800 shadow-lg scale-105' : 'border-transparent hover:border-gray-300'}`}>
                <div className="w-12 h-12 rounded-xl shadow-md flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
                  {isActive && <span className="text-white text-lg font-bold">✓</span>}
                </div>
                <span className="text-xs text-gray-600 font-medium text-center leading-tight">{theme.name}</span>
              </button>
            )
          })}
        </div>
      )}
      {tab === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: 'Основний колір', hint: 'Кнопки, значки, акценти', val: primaryColor, onChange: onChangePrimary,
              swatches: ['#ec4899','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#1f2937'] },
            { label: 'Акцентний колір', hint: 'Градієнти, підсвічування', val: accentColor, onChange: onChangeAccent,
              swatches: ['#a855f7','#6366f1','#06b6d4','#10b981','#84cc16','#f97316','#ec4899','#4b5563'] },
          ].map(({ label, hint, val, onChange, swatches }) => (
            <div key={label} className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">{hint}</p>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl border-2 border-gray-200 overflow-hidden cursor-pointer shadow-sm flex-shrink-0" style={{ background: val }}>
                  <input type="color" value={val} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <input type="text" value={val} onChange={e => onChange(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono focus:border-pink-400 focus:outline-none" maxLength={7} />
              </div>
              <div className="flex gap-2 flex-wrap">
                {swatches.map(c => (
                  <button key={c} type="button" onClick={() => onChange(c)}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${val === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/25 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {shopName.charAt(0) || '🌸'}
            </div>
            <span className="text-white font-semibold text-sm">{shopName || 'Назва магазину'}</span>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">Замовити</div>
            <div className="bg-white text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ color: primaryColor }}>Переглянути</div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-2 text-xs text-gray-400 text-center">
          Попередній перегляд · {primaryColor} → {accentColor}
        </div>
      </div>
    </div>
  )
}
