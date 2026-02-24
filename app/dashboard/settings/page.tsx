'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type Tab = 'general' | 'appearance' | 'contact' | 'hours' | 'delivery' | 'telegram'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
}

type DayHours = { open: string; close: string; closed: boolean }
type WeeklyHours = Record<string, DayHours>

const defaultDayHours: DayHours = { open: '09:00', close: '18:00', closed: false }
const defaultHours: WeeklyHours = Object.fromEntries(
  DAYS.map(d => [d, { ...defaultDayHours, closed: d === 'sunday' }])
)

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
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
    // General
    name: '',
    about: '',
    language: 'en',
    currency: 'USD',
    timezone: 'UTC',
    // Appearance
    coverImageUrl: '',
    logoUrl: '',
    primaryColor: '#ec4899',
    accentColor: '#a855f7',
    enableAnimations: true,
    // Contact
    location: '',
    city: '',
    country: '',
    googleMapsUrl: '',
    email: '',
    phoneNumber: '',
    whatsappNumber: '',
    telegramHandle: '',
    instagramHandle: '',
    // Hours handled separately
    // Delivery
    sameDayDelivery: true,
    deliveryTimeEstimate: '',
    deliveryCutoffTime: '14:00',
    minimumOrderAmount: 0,
    autoConfirmOrders: false,
    requirePhoneVerify: false,
    showDeliveryEstimate: true,
    allowSameDayOrders: true,
  })

  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>(defaultHours)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => { fetchShopData() }, [])

  const fetchShopData = async () => {
    try {
      const res = await fetch('/api/shop')
      const data = await res.json()
      if (data.shop) {
        const s = data.shop
        setShopData({
          name: s.name || '',
          about: s.about || '',
          language: s.language || 'en',
          currency: s.currency || 'USD',
          timezone: s.timezone || 'UTC',
          coverImageUrl: s.coverImageUrl || '',
          logoUrl: s.logoUrl || '',
          primaryColor: s.primaryColor || '#ec4899',
          accentColor: s.accentColor || '#a855f7',
          enableAnimations: s.enableAnimations ?? true,
          location: s.location || '',
          city: s.city || '',
          country: s.country || '',
          googleMapsUrl: s.googleMapsUrl || '',
          email: s.email || '',
          phoneNumber: s.phoneNumber || '',
          whatsappNumber: s.whatsappNumber || '',
          telegramHandle: s.telegramHandle || '',
          instagramHandle: s.instagramHandle || '',
          sameDayDelivery: s.sameDayDelivery ?? true,
          deliveryTimeEstimate: s.deliveryTimeEstimate || '',
          deliveryCutoffTime: s.deliveryCutoffTime || '14:00',
          minimumOrderAmount: s.minimumOrderAmount ?? 0,
          autoConfirmOrders: s.autoConfirmOrders ?? false,
          requirePhoneVerify: s.requirePhoneVerify ?? false,
          showDeliveryEstimate: s.showDeliveryEstimate ?? true,
          allowSameDayOrders: s.allowSameDayOrders ?? true,
        })
        if (s.coverImageUrl) setCoverPreview(s.coverImageUrl)
        if (s.logoUrl) setLogoPreview(s.logoUrl)
        if (s.telegramChatId) { setTelegramChatId(s.telegramChatId); setTelegramConnected(true) }
        if (s.workingHours) {
          try {
            const parsed = JSON.parse(s.workingHours)
            setWeeklyHours({ ...defaultHours, ...parsed })
          } catch {
            // keep defaults
          }
        }
      }
    } catch {}
  }

  const handleFileUpload = async (file: File, type: 'cover' | 'logo') => {
    if (file.size > 5 * 1024 * 1024) { setError('File is too large. Max 5MB.'); return }
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }

    setUploading(type)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      if (type === 'cover') {
        setShopData(p => ({ ...p, coverImageUrl: data.url }))
        setCoverPreview(data.url)
      } else {
        setShopData(p => ({ ...p, logoUrl: data.url }))
        setLogoPreview(data.url)
      }
      notify('✅ Image uploaded!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(null)
    }
  }

  const notify = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...shopData,
        workingHours: JSON.stringify(weeklyHours),
      }
      const res = await fetch('/api/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update shop')
      notify('✅ Settings saved successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const set = (key: string, value: any) => setShopData(p => ({ ...p, [key]: value }))

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '🏪' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'contact', label: 'Contact & Social', icon: '📞' },
    { id: 'hours', label: 'Working Hours', icon: '🕐' },
    { id: 'delivery', label: 'Delivery', icon: '🚚' },
    { id: 'telegram', label: 'Telegram', icon: '✈️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shop Settings</h1>
          <p className="text-gray-500 mt-1">Fully customize your public shop appearance and behavior</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="text-lg">✅</span> {success}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:w-52 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap w-full text-left ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">

                {/* ======== GENERAL ======== */}
                {activeTab === 'general' && (
                  <>
                    <SectionTitle icon="🏪" title="General Information" subtitle="Basic shop details shown to customers" />

                    <Field label="Shop Name" hint="Appears as your main heading">
                      <input type="text" required value={shopData.name} onChange={e => set('name', e.target.value)}
                        className={inputCls} placeholder="My Beautiful Flower Shop" />
                    </Field>

                    <Field label="About Your Shop" hint="Tell customers what makes you special">
                      <textarea rows={5} value={shopData.about} onChange={e => set('about', e.target.value)}
                        className={inputCls} placeholder="We craft stunning bouquets with love..." />
                    </Field>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Field label="Language">
                        <select value={shopData.language} onChange={e => set('language', e.target.value)} className={inputCls}>
                          <option value="en">🇺🇸 English</option>
                          <option value="uk">🇺🇦 Ukrainian</option>
                          <option value="de">🇩🇪 German</option>
                          <option value="fr">🇫🇷 French</option>
                          <option value="pl">🇵🇱 Polish</option>
                        </select>
                      </Field>
                      <Field label="Currency">
                        <select value={shopData.currency} onChange={e => set('currency', e.target.value)} className={inputCls}>
                          <option value="USD">💵 USD – US Dollar</option>
                          <option value="EUR">💶 EUR – Euro</option>
                          <option value="UAH">🇺🇦 UAH – Hryvnia</option>
                          <option value="GBP">💷 GBP – Pound</option>
                          <option value="PLN">🇵🇱 PLN – Złoty</option>
                        </select>
                      </Field>
                      <Field label="Timezone">
                        <select value={shopData.timezone} onChange={e => set('timezone', e.target.value)} className={inputCls}>
                          <option value="UTC">UTC</option>
                          <option value="Europe/Kyiv">Europe/Kyiv</option>
                          <option value="Europe/London">Europe/London</option>
                          <option value="Europe/Paris">Europe/Paris</option>
                          <option value="America/New_York">America/New York</option>
                          <option value="America/Chicago">America/Chicago</option>
                          <option value="America/Los_Angeles">America/Los Angeles</option>
                        </select>
                      </Field>
                    </div>
                  </>
                )}

                {/* ======== APPEARANCE ======== */}
                {activeTab === 'appearance' && (
                  <>
                    <SectionTitle icon="🎨" title="Appearance" subtitle="Customize the look of your public shop page" />

                    {/* Cover Image */}
                    <Field label="Cover Image" hint="Recommended: 1920×600px, under 5MB">
                      {coverPreview && (
                        <div className="mb-3 relative h-44 rounded-xl overflow-hidden border border-gray-200">
                          <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                          <button type="button" onClick={() => { setCoverPreview(null); set('coverImageUrl', '') }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )}
                      <label className="cursor-pointer block">
                        <div onClick={() => coverInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-400 transition-colors cursor-pointer">
                          {uploading === 'cover' ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                              <p className="text-sm text-gray-500">Uploading...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              </div>
                              <p className="text-sm font-medium text-gray-700">Click to upload cover photo</p>
                              <p className="text-xs text-gray-400">PNG, JPG, WebP</p>
                            </div>
                          )}
                        </div>
                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'cover') }} />
                      </label>
                    </Field>

                    {/* Logo */}
                    <Field label="Shop Logo" hint="Square image, min 200×200px">
                      <div className="flex items-center gap-5">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200 flex-shrink-0 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                          {logoPreview
                            ? <Image src={logoPreview} alt="Logo" width={96} height={96} className="object-cover w-full h-full" />
                            : <span className="text-3xl font-bold text-transparent bg-gradient-to-br from-pink-400 to-purple-500 bg-clip-text">{shopData.name.charAt(0) || '🌸'}</span>
                          }
                        </div>
                        <div className="flex flex-col gap-2">
                          <button type="button" onClick={() => logoInputRef.current?.click()}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                            {uploading === 'logo' ? 'Uploading...' : 'Upload Logo'}
                          </button>
                          {logoPreview && (
                            <button type="button" onClick={() => { setLogoPreview(null); set('logoUrl', '') }}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors">
                              Remove
                            </button>
                          )}
                        </div>
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'logo') }} />
                      </div>
                    </Field>

                    {/* Colors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Primary Color" hint="Main accent color (buttons, badges)">
                        <div className="flex items-center gap-3">
                          <input type="color" value={shopData.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                            className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer p-1" />
                          <input type="text" value={shopData.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                            className={`${inputCls} font-mono`} placeholder="#ec4899" />
                        </div>
                      </Field>
                      <Field label="Accent Color" hint="Secondary color (gradients, highlights)">
                        <div className="flex items-center gap-3">
                          <input type="color" value={shopData.accentColor} onChange={e => set('accentColor', e.target.value)}
                            className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer p-1" />
                          <input type="text" value={shopData.accentColor} onChange={e => set('accentColor', e.target.value)}
                            className={`${inputCls} font-mono`} placeholder="#a855f7" />
                        </div>
                      </Field>
                    </div>

                    {/* Preview swatch */}
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <div className="p-4 text-white text-sm font-semibold" style={{ background: `linear-gradient(to right, ${shopData.primaryColor}, ${shopData.accentColor})` }}>
                        Preview: {shopData.name || 'Your Shop Name'}
                      </div>
                    </div>

                    {/* Animations */}
                    <Toggle
                      label="Enable Animations"
                      hint="Smooth hover effects and transitions on the shop page"
                      checked={shopData.enableAnimations}
                      onChange={v => set('enableAnimations', v)}
                    />
                  </>
                )}

                {/* ======== CONTACT & SOCIAL ======== */}
                {activeTab === 'contact' && (
                  <>
                    <SectionTitle icon="📞" title="Contact & Location" subtitle="How customers can find and reach you" />

                    <Field label="Street Address" hint="Full address shown on your shop page">
                      <input type="text" value={shopData.location} onChange={e => set('location', e.target.value)}
                        className={inputCls} placeholder="123 Rose Street, Downtown" />
                    </Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="City">
                        <input type="text" value={shopData.city} onChange={e => set('city', e.target.value)}
                          className={inputCls} placeholder="Kyiv" />
                      </Field>
                      <Field label="Country">
                        <input type="text" value={shopData.country} onChange={e => set('country', e.target.value)}
                          className={inputCls} placeholder="Ukraine" />
                      </Field>
                    </div>

                    <Field label="Google Maps URL" hint="Custom Maps link (overrides auto-generated)">
                      <input type="url" value={shopData.googleMapsUrl} onChange={e => set('googleMapsUrl', e.target.value)}
                        className={inputCls} placeholder="https://maps.google.com/..." />
                    </Field>

                    <hr className="border-gray-100" />
                    <SectionTitle icon="📱" title="Contact Methods" subtitle="Ways customers can reach you" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Email Address">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                          <input type="email" value={shopData.email} onChange={e => set('email', e.target.value)}
                            className={`${inputCls} pl-9`} placeholder="hello@yourshop.com" />
                        </div>
                      </Field>
                      <Field label="Phone Number">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📞</span>
                          <input type="tel" value={shopData.phoneNumber} onChange={e => set('phoneNumber', e.target.value)}
                            className={`${inputCls} pl-9`} placeholder="+380 99 123 4567" />
                        </div>
                      </Field>
                    </div>

                    <hr className="border-gray-100" />
                    <SectionTitle icon="💬" title="Social & Messaging" subtitle="Messaging apps and social media" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="WhatsApp Number" hint="International format, numbers only">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-bold text-xs">WA</span>
                          <input type="tel" value={shopData.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)}
                            className={`${inputCls} pl-10`} placeholder="+380991234567" />
                        </div>
                      </Field>
                      <Field label="Telegram Handle">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">@</span>
                          <input type="text" value={shopData.telegramHandle} onChange={e => set('telegramHandle', e.target.value)}
                            className={`${inputCls} pl-8`} placeholder="yourshop" />
                        </div>
                      </Field>
                      <Field label="Instagram Handle">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500">@</span>
                          <input type="text" value={shopData.instagramHandle} onChange={e => set('instagramHandle', e.target.value)}
                            className={`${inputCls} pl-8`} placeholder="yourshop" />
                        </div>
                      </Field>
                    </div>
                  </>
                )}

                {/* ======== WORKING HOURS ======== */}
                {activeTab === 'hours' && (
                  <>
                    <SectionTitle icon="🕐" title="Working Hours" subtitle="Set your schedule for each day of the week" />

                    <div className="space-y-3">
                      {DAYS.map(day => {
                        const hours = weeklyHours[day] || defaultDayHours
                        return (
                          <div key={day} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${hours.closed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
                            <div className="w-28 flex-shrink-0">
                              <span className={`font-medium text-sm ${hours.closed ? 'text-gray-400' : 'text-gray-700'}`}>
                                {DAY_LABELS[day]}
                              </span>
                            </div>

                            {hours.closed ? (
                              <div className="flex-1 text-sm text-gray-400 italic">Closed</div>
                            ) : (
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-500">Open</label>
                                  <input type="time" value={hours.open}
                                    onChange={e => setWeeklyHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-pink-400 focus:outline-none" />
                                </div>
                                <span className="text-gray-400">—</span>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-500">Close</label>
                                  <input type="time" value={hours.close}
                                    onChange={e => setWeeklyHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:border-pink-400 focus:outline-none" />
                                </div>
                              </div>
                            )}

                            <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                              <div className={`relative w-10 h-5 rounded-full transition-colors ${hours.closed ? 'bg-gray-300' : 'bg-green-500'}`}
                                onClick={() => setWeeklyHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !hours.closed } }))}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hours.closed ? 'left-0.5' : 'left-5'}`} />
                              </div>
                              <span className="text-xs text-gray-500">{hours.closed ? 'Closed' : 'Open'}</span>
                            </label>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex gap-3">
                      <button type="button" onClick={() => setWeeklyHours(Object.fromEntries(DAYS.map(d => [d, { open: '09:00', close: '18:00', closed: false }])))}
                        className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                        Set all open (9–18)
                      </button>
                      <button type="button" onClick={() => setWeeklyHours(prev => ({ ...prev, saturday: { ...prev.saturday, closed: true }, sunday: { ...prev.sunday, closed: true } }))}
                        className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                        Close weekends
                      </button>
                    </div>
                  </>
                )}

                {/* ======== TELEGRAM ======== */}
                {activeTab === 'telegram' && (
                  <div className="space-y-6">
                    <SectionTitle icon="✈️" title="Telegram Notifications" subtitle="Receive orders and manage them directly in Telegram" />

                    {/* How it works */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-2">
                      <p className="font-bold">📱 How it works:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>Open Telegram and search for <strong>@{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot'}</strong></li>
                        <li>Press <strong>Start</strong> or type <code className="bg-blue-100 px-1 rounded">/getchatid</code></li>
                        <li>Copy the Chat ID the bot sends you</li>
                        <li>Paste it below and click Connect</li>
                      </ol>
                      <p className="text-blue-600 text-xs mt-2">When a customer orders, you'll get a Telegram message with ✅ Confirm and ❌ Cancel buttons!</p>
                    </div>

                    {telegramConnected ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-green-800">✅ Telegram Connected!</p>
                            <p className="text-sm text-green-600 mt-0.5">Chat ID: <code className="bg-green-100 px-1.5 py-0.5 rounded font-mono">{telegramChatId}</code></p>
                          </div>
                          <button type="button" onClick={async () => {
                            setTelegramLoading(true); setTelegramError(''); setTelegramMsg('')
                            try {
                              await fetch('/api/telegram/connect', { method: 'DELETE' })
                              setTelegramConnected(false); setTelegramChatId('')
                              setTelegramMsg('Telegram disconnected.')
                            } catch { setTelegramError('Failed to disconnect') }
                            finally { setTelegramLoading(false) }
                          }} disabled={telegramLoading}
                            className="bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors">
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Telegram Chat ID</label>
                          <input type="text" value={telegramChatId}
                            onChange={e => setTelegramChatId(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none font-mono"
                            placeholder="e.g. 123456789" />
                          <p className="text-xs text-gray-400 mt-1">Get this by messaging the bot /getchatid</p>
                        </div>
                        <button type="button" onClick={async () => {
                          if (!telegramChatId.trim()) { setTelegramError('Please enter your Chat ID'); return }
                          setTelegramLoading(true); setTelegramError(''); setTelegramMsg('')
                          try {
                            const res = await fetch('/api/telegram/connect', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ chatId: telegramChatId.trim() })
                            })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.error)
                            setTelegramConnected(true)
                            setTelegramMsg(data.message)
                          } catch (err: any) { setTelegramError(err.message) }
                          finally { setTelegramLoading(false) }
                        }} disabled={telegramLoading || !telegramChatId.trim()}
                          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                          {telegramLoading ? 'Connecting...' : '🔗 Connect Telegram'}
                        </button>
                      </div>
                    )}

                    {telegramMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{telegramMsg}</div>}
                    {telegramError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{telegramError}</div>}

                    {/* Preview of what message looks like */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Preview — what you'll receive:</p>
                      <div className="bg-gray-900 rounded-2xl p-4 text-white text-sm font-mono space-y-1">
                        <p>🌸 <strong>New Order — Your Shop</strong></p>
                        <p>👤 Customer: Maria Kovalenko</p>
                        <p>📞 Phone: +380991234567</p>
                        <p>💐 Flower: Red Rose Bouquet — $45</p>
                        <p>🚚 Delivery: Delivery</p>
                        <p>📍 Address: Khreshchatyk 1, Kyiv</p>
                        <p>💬 Message: Please add a card</p>
                        <div className="mt-3 flex gap-2">
                          <span className="bg-green-600 text-white px-3 py-1 rounded text-xs">✅ Confirm</span>
                          <span className="bg-red-600 text-white px-3 py-1 rounded text-xs">❌ Cancel</span>
                        </div>
                        <div className="mt-1">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">🎉 Mark Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ======== DELIVERY ======== */}
                {activeTab === 'delivery' && (
                  <>
                    <SectionTitle icon="🚚" title="Delivery Settings" subtitle="Configure how you deliver to customers" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Delivery Time Estimate" hint="E.g. '2–4 hours' or '1–2 days'">
                        <input type="text" value={shopData.deliveryTimeEstimate} onChange={e => set('deliveryTimeEstimate', e.target.value)}
                          className={inputCls} placeholder="2–4 hours" />
                      </Field>
                      <Field label="Order Cutoff Time" hint="Orders after this time go next day">
                        <input type="time" value={shopData.deliveryCutoffTime} onChange={e => set('deliveryCutoffTime', e.target.value)}
                          className={inputCls} />
                      </Field>
                    </div>

                    <Field label="Minimum Order Amount" hint="Set to 0 for no minimum">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                          {shopData.currency === 'UAH' ? '₴' : shopData.currency === 'EUR' ? '€' : shopData.currency === 'GBP' ? '£' : '$'}
                        </span>
                        <input type="number" min="0" step="0.01" value={shopData.minimumOrderAmount}
                          onChange={e => set('minimumOrderAmount', parseFloat(e.target.value) || 0)}
                          className={`${inputCls} pl-8`} />
                      </div>
                    </Field>

                    <hr className="border-gray-100" />
                    <div className="space-y-4">
                      <Toggle
                        label="Same-Day Delivery"
                        hint="Allow customers to get orders the same day"
                        checked={shopData.sameDayDelivery}
                        onChange={v => set('sameDayDelivery', v)}
                      />
                      <Toggle
                        label="Allow Same-Day Orders"
                        hint="Accept orders for same-day processing"
                        checked={shopData.allowSameDayOrders}
                        onChange={v => set('allowSameDayOrders', v)}
                      />
                      <Toggle
                        label="Show Delivery Estimate"
                        hint="Display estimated delivery time on shop page"
                        checked={shopData.showDeliveryEstimate}
                        onChange={v => set('showDeliveryEstimate', v)}
                      />
                      <Toggle
                        label="Auto-Confirm Orders"
                        hint="Automatically confirm orders without manual review"
                        checked={shopData.autoConfirmOrders}
                        onChange={v => set('autoConfirmOrders', v)}
                      />
                      <Toggle
                        label="Require Phone Verification"
                        hint="Customers must verify their phone before ordering"
                        checked={shopData.requirePhoneVerify}
                        onChange={v => set('requirePhoneVerify', v)}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Save Bar */}
              <div className="mt-4 flex items-center gap-4 bg-white rounded-2xl shadow-sm px-6 py-4">
                <button type="submit" disabled={loading || uploading !== null}
                  className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg">
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button type="button" onClick={fetchShopData} disabled={loading}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50">
                  Reset
                </button>
                <p className="text-sm text-gray-400 ml-auto hidden sm:block">Changes apply to your public shop page immediately</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Reusable Components =====

const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition-all'

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
      <div className="w-9 h-9 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
        {icon}
      </div>
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
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  )
}
