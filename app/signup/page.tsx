'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PLANS, getPlanConfig } from '@/lib/plans'

function validatePasswordLive(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }
}

function validateEmailLive(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const pwCheckKeys = [
  { key: 'length', label: 'Мінімум 8 символів' },
  { key: 'uppercase', label: 'Одна велика літера (A-Z)' },
  { key: 'lowercase', label: 'Одна мала літера (a-z)' },
  { key: 'number', label: 'Одна цифра (0-9)' },
  { key: 'special', label: 'Один спецсимвол (!@#$...)' },
]

function SignupForm() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [planSlug, setPlanSlug] = useState<string>('free')
  const [account, setAccount] = useState({ email: '', password: '' })
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [shop, setShop] = useState({ shopName: '', location: '', about: '' })
  const [payment, setPayment] = useState({ cardNumber: '', cardExpiry: '', cardCvc: '', cardHolderName: '' })

  const plan = getPlanConfig(planSlug)
  const isPaid = plan.price > 0
  const totalSteps = isPaid ? 5 : 4

  const pwChecks = validatePasswordLive(account.password)
  const pwAllGood = Object.values(pwChecks).every(Boolean)
  const emailValid = validateEmailLive(account.email)

  const handlePaymentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
      if (value.length > 19) return
    }
    if (name === 'cardExpiry') {
      value = value.replace(/\D/g, '')
      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4)
      if (value.length > 5) return
    }
    if (name === 'cardCvc') value = value.replace(/\D/g, '').slice(0, 4)
    setPayment(prev => ({ ...prev, [name]: value }))
  }

  const handleContinue = () => {
    setError('')
    if (step === 2) {
      if (!account.email || !emailValid) { setError('Будь ласка, введіть дійсний email'); return }
      if (!account.password || !pwAllGood) { setError('Будь ласка, виправте пароль перед продовженням'); return }
    }
    if (step === 3 && !shop.shopName.trim()) { setError('Будь ласка, введіть назву магазину'); return }
    if (step === 4 && isPaid) {
      if (!payment.cardHolderName || !payment.cardNumber || !payment.cardExpiry || !payment.cardCvc) {
        setError('Будь ласка, заповніть всі поля картки'); return
      }
    }
    setStep(prev => (prev < totalSteps ? (prev + 1) as any : prev))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: shop.shopName,
          email: account.email.toLowerCase().trim(),
          password: account.password,
          planSlug,
          location: shop.location || null,
          about: shop.about || null,
          ...(isPaid ? {
            cardNumber: payment.cardNumber,
            cardExpiry: payment.cardExpiry,
            cardCvc: payment.cardCvc,
            cardHolderName: payment.cardHolderName,
          } : {})
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Помилка реєстрації')
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 md:p-8">

        {/* Header */}
        <div className="mb-5">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl">🌸</span>
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">FlowerGoUa</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">Створіть свій квітковий магазин</h1>
          <p className="text-sm text-gray-400 mt-1">Крок {step} з {totalSteps}</p>
          {isPaid && (
            <div className="mt-2 text-xs text-gray-500">
              Обраний план: <span className="font-bold text-pink-600">{plan.name} — {plan.price} грн/міс</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="relative mb-6 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-5 text-sm">⚠️ {error}</div>
        )}

        {/* ─── STEP 1: Plan ─── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-black text-gray-900 mb-1">Оберіть план</h2>
            <p className="text-sm text-gray-400 mb-5">Змінити план можна будь-коли з дашборду.</p>
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => (
                <button key={p.slug} type="button" onClick={() => setPlanSlug(p.slug)}
                  className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all active:scale-98 ${
                    p.slug === planSlug ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}>
                  {p.highlight && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-0.5 rounded-full font-bold whitespace-nowrap">
                      Найпопулярніший
                    </span>
                  )}
                  <div className="text-2xl mb-2">{p.slug === 'free' ? '🌱' : p.slug === 'basic' ? '🌸' : '🌺'}</div>
                  <span className="font-black text-gray-900 mb-1">{p.name}</span>
                  <span className="text-sm font-bold text-pink-600 mb-2">{p.priceLabel}</span>
                  <p className="text-xs text-gray-500 leading-relaxed">{p.tagline}</p>
                  {p.slug === planSlug && (
                    <div className="mt-3 text-xs text-pink-600 font-semibold">✓ Обрано</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP 2: Account ─── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 mb-1">Створіть акаунт</h2>
            <p className="text-sm text-gray-400 mb-4">Ви будете використовувати цей email для входу.</p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={account.email}
                onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
                onBlur={() => setEmailTouched(true)}
                className={`w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none transition-colors ${
                  emailTouched && account.email
                    ? emailValid ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                    : 'border-gray-200 bg-gray-50 focus:border-pink-400'
                }`}
                placeholder="you@example.com" />
              {emailTouched && account.email && (
                <p className={`text-xs mt-1 ${emailValid ? 'text-green-600' : 'text-red-500'}`}>
                  {emailValid ? '✓ Виглядає добре!' : 'Введіть дійсну email адресу'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Пароль</label>
              <input type="password" required value={account.password}
                onChange={e => { setAccount(p => ({ ...p, password: e.target.value })); setPasswordTouched(true) }}
                className={`w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none transition-colors ${
                  passwordTouched && account.password
                    ? pwAllGood ? 'border-green-400 bg-green-50' : 'border-orange-300 bg-orange-50'
                    : 'border-gray-200 bg-gray-50 focus:border-pink-400'
                }`}
                placeholder="Створіть надійний пароль" />
              {passwordTouched && (
                <div className="mt-2.5 space-y-1.5">
                  {pwCheckKeys.map(({ key, label }) => (
                    <div key={key} className={`flex items-center gap-2 text-xs ${pwChecks[key as keyof typeof pwChecks] ? 'text-green-600' : 'text-gray-400'}`}>
                      <span className="text-sm">{pwChecks[key as keyof typeof pwChecks] ? '✓' : '○'}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 3: Shop ─── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 mb-1">Назвіть магазин</h2>
            <p className="text-sm text-gray-400 mb-4">Це буде відображатися вгорі вашої публічної сторінки.</p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Назва магазину <span className="text-red-400">*</span></label>
              <input type="text" required value={shop.shopName}
                onChange={e => setShop(p => ({ ...p, shopName: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none bg-gray-50"
                placeholder="Квіти від Марії" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Адреса</label>
              <input type="text" value={shop.location}
                onChange={e => setShop(p => ({ ...p, location: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none bg-gray-50"
                placeholder="вул. Хрещатик 1, Київ" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Про магазин</label>
              <textarea rows={3} value={shop.about}
                onChange={e => setShop(p => ({ ...p, about: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none resize-none bg-gray-50"
                placeholder="Розкажіть клієнтам про ваш магазин..." />
            </div>
          </div>
        )}

        {/* ─── STEP 4: Payment ─── */}
        {step === 4 && isPaid && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 mb-1">💳 Деталі оплати</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
              <p className="font-bold mb-1">{plan.name} — {plan.price} грн/міс</p>
              <p>Оплату буде перевірено вручну протягом 24 годин.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ім'я власника картки</label>
              <input type="text" name="cardHolderName" required value={payment.cardHolderName}
                onChange={handlePaymentInput}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none bg-gray-50"
                placeholder="Іван Іваненко" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Номер картки</label>
              <input type="text" name="cardNumber" required value={payment.cardNumber}
                onChange={handlePaymentInput}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none font-mono tracking-wider bg-gray-50"
                placeholder="1234 5678 9012 3456" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Термін дії</label>
                <input type="text" name="cardExpiry" required value={payment.cardExpiry}
                  onChange={handlePaymentInput}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none font-mono bg-gray-50"
                  placeholder="MM/РР" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CVC</label>
                <input type="text" name="cardCvc" required value={payment.cardCvc}
                  onChange={handlePaymentInput}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none font-mono bg-gray-50"
                  placeholder="123" />
              </div>
            </div>
            <p className="text-xs text-gray-400">🔒 Деталі картки зберігаються безпечно лише для ручної перевірки.</p>
          </div>
        )}

        {/* ─── FINAL: Confirm ─── */}
        {((step === 4 && !isPaid) || (step === 5 && isPaid)) && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-black text-gray-900 mb-4">✅ Підтвердження</h2>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 text-sm mb-4 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">План</span>
                <span className="font-bold">{plan.name} {isPaid ? `— ${plan.price} грн` : '(Безкоштовно)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{account.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Магазин</span>
                <span className="font-bold">{shop.shopName}</span>
              </div>
              {shop.location && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Адреса</span>
                  <span>{shop.location}</span>
                </div>
              )}
              {isPaid && payment.cardNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Картка</span>
                  <span>•••• {payment.cardNumber.replace(/\s/g, '').slice(-4)}</span>
                </div>
              )}
            </div>
            {isPaid && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 mb-4">
                ⏳ Після реєстрації акаунт буде на безкоштовному плані до підтвердження оплати (до 24 год).
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-base hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]">
              {loading ? '⏳ Створюємо магазин...' : '🌸 Створити мій магазин'}
            </button>
          </form>
        )}

        {/* Navigation */}
        {step < totalSteps && (
          <div className="flex items-center justify-between border-t border-gray-100 pt-5 mt-6">
            <button type="button" onClick={() => { setError(''); setStep(p => p > 1 ? (p - 1) as any : p) }}
              disabled={step === 1}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30 px-2 py-1 transition-colors">
              ← Назад
            </button>
            <button type="button" onClick={handleContinue}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-7 py-3 rounded-2xl text-sm font-bold hover:from-pink-600 hover:to-purple-700 transition-all shadow-md active:scale-95">
              Продовжити →
            </button>
          </div>
        )}
        {step > 1 && step === totalSteps && (
          <div className="flex border-t border-gray-100 pt-4 mt-4">
            <button type="button" onClick={() => { setError(''); setStep(p => (p - 1) as any) }}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Назад
            </button>
          </div>
        )}

        <p className="mt-5 text-center text-xs text-gray-400">
          Вже є акаунт?{' '}
          <Link href="/login" className="font-bold text-pink-600 hover:text-pink-700">Увійти</Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
