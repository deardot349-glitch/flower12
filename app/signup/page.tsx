'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Check, ArrowRight, ArrowLeft, AlertCircle, Eye, EyeOff, CreditCard, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PLANS, getPlanConfig } from '@/lib/plans'

function validatePasswordLive(password: string) {
  return {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }
}

const pwCheckKeys = [
  { key: 'length',    label: 'Мінімум 8 символів' },
  { key: 'uppercase', label: 'Одна велика літера' },
  { key: 'lowercase', label: 'Одна мала літера' },
  { key: 'number',    label: 'Одна цифра' },
  { key: 'special',   label: 'Один спецсимвол' },
]

function SignupForm() {
  const router = useRouter()
  // For free plan: steps 1-2-3-4 (plan, account, shop, confirm)
  // For paid plan: steps 1-2-3-4-5 (plan, account, shop, payment, confirm)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [planSlug, setPlanSlug] = useState('free')
  const [account, setAccount] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [shop, setShop] = useState({ shopName: '', location: '', about: '' })
  const [payment, setPayment] = useState({ cardNumber: '', cardExpiry: '', cardCvc: '', cardHolderName: '' })

  const plan = getPlanConfig(planSlug)
  const isPaid = plan.price > 0
  const totalSteps = isPaid ? 5 : 4

  const STEP_LABELS = isPaid
    ? ['План', 'Акаунт', 'Магазин', 'Оплата', 'Підтвердження']
    : ['План', 'Акаунт', 'Магазин', 'Підтвердження']

  const pwChecks = validatePasswordLive(account.password)
  const pwAllGood = Object.values(pwChecks).every(Boolean)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)

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
      if (!account.password || !pwAllGood) { setError('Пароль не відповідає вимогам'); return }
    }
    if (step === 3 && !shop.shopName.trim()) { setError('Введіть назву магазину'); return }
    if (step === 4 && isPaid) {
      if (!payment.cardHolderName || !payment.cardNumber || !payment.cardExpiry || !payment.cardCvc) {
        setError('Будь ласка, заповніть всі поля картки')
        return
      }
    }
    if (step < totalSteps) setStep(s => (s + 1) as any)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
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
          } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Помилка реєстрації')
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Which step index (1-based) to show as confirm (last step)
  const confirmStep = totalSteps

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Left sidebar ── */}
      <div className="hidden lg:flex lg:w-72 xl:w-80 bg-gray-950 flex-col p-8 xl:p-10 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 70%, #ec4899 0%, transparent 60%),
              radial-gradient(circle at 70% 30%, #a855f7 0%, transparent 60%)`,
          }}
        />
        <div className="relative z-10 flex flex-col h-full">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-base shadow-lg">🌸</div>
            <span className="text-white font-bold text-lg">FlowerGoUa</span>
          </Link>

          <div className="space-y-2">
            {STEP_LABELS.map((label, idx) => {
              const num = idx + 1
              const isDone = step > num
              const isActive = step === num
              return (
                <div key={num} className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-colors ${isActive ? 'bg-white/10' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    isDone ? 'bg-emerald-500 text-white' :
                    isActive ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg' :
                    'bg-white/10 text-gray-500'
                  }`}>
                    {isDone ? <Check className="h-3.5 w-3.5" /> : num}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-white' : isDone ? 'text-gray-400' : 'text-gray-600'}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>

          {isPaid && (
            <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-pink-400 mb-1">Обраний план</p>
              <p className="text-white font-bold">{plan.name}</p>
              <p className="text-gray-400 text-xs mt-0.5">{plan.price} грн/міс</p>
            </div>
          )}

          <div className="mt-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs leading-relaxed">
                Приєднуйтесь до флористів по всій Україні що вже продають через FlowerGoUa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main form area ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2">
              <span>🌸</span>
              <span className="font-bold text-gray-900">FlowerGoUa</span>
            </Link>
            <span className="text-sm text-gray-400">Крок {step} / {totalSteps}</span>
          </div>

          {/* Mobile progress bar */}
          <div className="lg:hidden h-1 bg-gray-200 rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ─── STEP 1: Plan ─── */}
          {step === 1 && (
            <div>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Оберіть план</h1>
                <p className="text-gray-500 text-sm">Змінити план можна будь-коли. Починайте безкоштовно.</p>
              </div>
              <div className="space-y-3">
                {PLANS.map((p) => (
                  <button key={p.slug} type="button" onClick={() => setPlanSlug(p.slug)}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                      p.slug === planSlug
                        ? 'border-pink-500 bg-pink-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{p.slug === 'free' ? '🌱' : p.slug === 'basic' ? '🌸' : '🌺'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                            {p.highlight && (
                              <span className="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-full font-semibold">Популярний</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{p.tagline}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-pink-600 text-sm">{p.priceLabel}</span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          p.slug === planSlug ? 'border-pink-500 bg-pink-500' : 'border-gray-300'
                        }`}>
                          {p.slug === planSlug && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP 2: Account ─── */}
          {step === 2 && (
            <div>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Створіть акаунт</h1>
                <p className="text-gray-500 text-sm">Цей email буде використовуватися для входу.</p>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={account.email}
                    onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    className={account.email ? (emailValid ? 'border-emerald-400 focus-visible:ring-emerald-300' : 'border-red-400 focus-visible:ring-red-300') : ''}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Пароль</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} required
                      value={account.password}
                      onChange={e => { setAccount(p => ({ ...p, password: e.target.value })); setPasswordTouched(true) }}
                      placeholder="Мінімум 8 символів" className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordTouched && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                      {pwCheckKeys.map(({ key, label }) => (
                        <div key={key} className={`flex items-center gap-1.5 text-xs ${
                          pwChecks[key as keyof typeof pwChecks] ? 'text-emerald-600' : 'text-gray-400'
                        }`}>
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            pwChecks[key as keyof typeof pwChecks] ? 'bg-emerald-100' : 'bg-gray-100'
                          }`}>
                            {pwChecks[key as keyof typeof pwChecks] && <Check className="h-2 w-2" />}
                          </div>
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Shop ─── */}
          {step === 3 && (
            <div>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Назвіть магазин</h1>
                <p className="text-gray-500 text-sm">Це відображатиметься вгорі вашої публічної сторінки.</p>
              </div>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="shopName">Назва магазину *</Label>
                  <Input id="shopName" required value={shop.shopName}
                    onChange={e => setShop(p => ({ ...p, shopName: e.target.value }))}
                    placeholder="Квіти від Марії" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location">Адреса <span className="text-gray-400 font-normal">(необов'язково)</span></Label>
                  <Input id="location" value={shop.location}
                    onChange={e => setShop(p => ({ ...p, location: e.target.value }))}
                    placeholder="вул. Хрещатик 1, Київ" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="about">Про магазин <span className="text-gray-400 font-normal">(необов'язково)</span></Label>
                  <Textarea id="about" rows={3} value={shop.about}
                    onChange={e => setShop(p => ({ ...p, about: e.target.value }))}
                    placeholder="Розкажіть клієнтам про ваш магазин..." />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Payment (paid plans only) ─── */}
          {step === 4 && isPaid && (
            <div>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Дані для оплати</h1>
                <p className="text-gray-500 text-sm">Ваш вибір: <span className="font-semibold text-pink-600">{plan.name} — {plan.price} грн/міс</span></p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-800 flex items-start gap-3">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Оплату буде перевірено вручну протягом 24 годин. До підтвердження ваш акаунт працює на безкоштовному плані.</p>
              </div>

              <div className="space-y-4">
                {/* Card preview */}
                <div className="relative h-44 rounded-2xl overflow-hidden shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #1f2937, #374151)' }}>
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: `radial-gradient(circle at 80% 20%, #ec4899 0%, transparent 50%)` }}
                  />
                  <div className="relative p-6 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start">
                      <CreditCard className="w-8 h-8 text-white/60" strokeWidth={1.5} />
                      <div className="text-xs text-white/50 font-medium tracking-widest">VISA / MC</div>
                    </div>
                    <div>
                      <p className="font-mono text-white text-lg tracking-[0.2em] mb-3">
                        {payment.cardNumber || '•••• •••• •••• ••••'}
                      </p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Власник</p>
                          <p className="text-white text-xs font-semibold uppercase tracking-wide">
                            {payment.cardHolderName || 'ВАШЕ ІМ\'Я'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Термін дії</p>
                          <p className="text-white text-xs font-semibold">{payment.cardExpiry || 'MM/РР'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cardHolderName">Ім'я власника картки</Label>
                  <Input id="cardHolderName" name="cardHolderName" type="text"
                    value={payment.cardHolderName} onChange={handlePaymentInput}
                    placeholder="ІВАН ІВАНЕНКО" className="uppercase tracking-wide" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cardNumber">Номер картки</Label>
                  <Input id="cardNumber" name="cardNumber" type="text"
                    value={payment.cardNumber} onChange={handlePaymentInput}
                    placeholder="1234 5678 9012 3456" className="font-mono tracking-widest" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cardExpiry">Термін дії</Label>
                    <Input id="cardExpiry" name="cardExpiry" type="text"
                      value={payment.cardExpiry} onChange={handlePaymentInput}
                      placeholder="MM/РР" className="font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cardCvc">CVC / CVV</Label>
                    <Input id="cardCvc" name="cardCvc" type="text"
                      value={payment.cardCvc} onChange={handlePaymentInput}
                      placeholder="•••" className="font-mono" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  Дані картки зберігаються лише для ручної перевірки і не використовуються для автоматичного списання.
                </div>
              </div>
            </div>
          )}

          {/* ─── FINAL STEP: Confirm ─── */}
          {step === confirmStep && (
            <form onSubmit={handleSubmit}>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Підтвердження</h1>
                <p className="text-gray-500 text-sm">Перевірте дані перед створенням магазину.</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 mb-6 overflow-hidden">
                {[
                  { label: 'План', value: `${plan.name}${isPaid ? ` — ${plan.price} грн/міс` : ' (Безкоштовно)'}` },
                  { label: 'Email', value: account.email },
                  { label: 'Магазин', value: shop.shopName },
                  ...(shop.location ? [{ label: 'Адреса', value: shop.location }] : []),
                  ...(isPaid && payment.cardNumber
                    ? [{ label: 'Картка', value: `•••• ${payment.cardNumber.replace(/\s/g, '').slice(-4)}` }]
                    : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
              </div>

              {isPaid && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-800 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Після реєстрації акаунт активується на безкоштовному плані до підтвердження оплати (до 24 год).
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-12 text-base">
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Створюємо магазин...</>
                  : <>Створити мій магазин <ArrowRight className="h-4 w-4" /></>
                }
              </Button>
            </form>
          )}

          {/* Navigation */}
          {step < confirmStep && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button type="button"
                onClick={() => { setError(''); if (step > 1) setStep(s => (s - 1) as any) }}
                disabled={step === 1}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Назад
              </button>
              <Button onClick={handleContinue} size="default">
                Продовжити <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {step === confirmStep && (
            <button type="button"
              onClick={() => { setError(''); setStep((confirmStep - 1) as any) }}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mt-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Назад
            </button>
          )}

          <p className="mt-6 text-center text-xs text-gray-400">
            Вже є акаунт?{' '}
            <Link href="/login" className="font-semibold text-pink-600 hover:text-pink-700">Увійти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
