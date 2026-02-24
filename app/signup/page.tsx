'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PLANS, getPlanConfig } from '@/lib/plans'

const T = {
  uk: {
    title: 'Створіть свій квітковий магазин',
    step: 'Крок',
    of: 'з',
    selectedPlan: 'Обраний план',
    step1Title: 'Оберіть план',
    step1Sub: 'Змінити план можна будь-коли з дашборду.',
    step2Title: 'Створіть акаунт',
    step2Sub: 'Ви будете використовувати цей email для входу.',
    emailLabel: 'Email',
    passwordLabel: 'Пароль',
    passwordPlaceholder: 'Створіть надійний пароль',
    step3Title: 'Назвіть магазин',
    step3Sub: 'Це буде відображатися вгорі вашої публічної сторінки.',
    shopNameLabel: 'Назва магазину',
    shopNamePlaceholder: 'Квіти від Марії',
    locationLabel: 'Адреса',
    locationPlaceholder: 'вул. Хрещатик 1, Київ',
    aboutLabel: 'Про магазин',
    aboutPlaceholder: 'Розкажіть клієнтам про ваш магазин...',
    step4Title: '💳 Деталі оплати',
    cardName: "Ім'я власника картки",
    cardNumber: 'Номер картки',
    cardExpiry: 'Термін дії',
    cardCvc: 'CVC',
    cardNamePlaceholder: 'Іван Іваненко',
    paymentNote: 'Оплату буде перевірено вручну протягом 24 годин.',
    confirmTitle: '✅ Підтвердження',
    plan: 'План',
    email: 'Email',
    shop: 'Магазин',
    location: 'Адреса',
    card: 'Картка',
    pendingNote: 'Після реєстрації акаунт буде на безкоштовному плані до підтвердження оплати (до 24 год).',
    createBtn: '🌸 Створити мій магазин',
    creating: 'Створюємо магазин...',
    back: '← Назад',
    continue: 'Продовжити →',
    alreadyHave: 'Вже є акаунт?',
    signIn: 'Увійти',
    pwLength: 'Мінімум 8 символів',
    pwUpper: 'Одна велика літера (A-Z)',
    pwLower: 'Одна мала літера (a-z)',
    pwNumber: 'Одна цифра (0-9)',
    pwSpecial: 'Один спецсимвол (!@#$...)',
    emailValid: '✓ Виглядає добре!',
    emailInvalid: 'Введіть дійсну email адресу',
    errEmail: 'Будь ласка, введіть дійсний email',
    errPassword: 'Будь ласка, виправте пароль перед продовженням',
    errShopName: 'Будь ласка, введіть назву магазину',
    errCard: 'Будь ласка, заповніть всі поля картки',
    cardSecure: '🔒 Деталі картки зберігаються безпечно лише для ручної перевірки.',
    free: '(Безкоштовно)',
    mostPopular: 'Популярний',
  },
  en: {
    title: 'Set up your flower shop',
    step: 'Step',
    of: 'of',
    selectedPlan: 'Selected plan',
    step1Title: 'Choose your plan',
    step1Sub: 'You can upgrade anytime from your dashboard.',
    step2Title: 'Create your account',
    step2Sub: "You'll use this email to sign in to your dashboard.",
    emailLabel: 'Email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create a strong password',
    step3Title: 'Name your shop',
    step3Sub: 'This appears at the top of your public shop page.',
    shopNameLabel: 'Shop name',
    shopNamePlaceholder: 'Rosy Corner Florist',
    locationLabel: 'Location',
    locationPlaceholder: '123 Rose Street, Kyiv',
    aboutLabel: 'About your shop',
    aboutPlaceholder: 'Tell customers about your shop...',
    step4Title: '💳 Payment Details',
    cardName: 'Cardholder Name',
    cardNumber: 'Card Number',
    cardExpiry: 'Expiry',
    cardCvc: 'CVC',
    cardNamePlaceholder: 'John Doe',
    paymentNote: 'Payment will be verified manually within 24 hours.',
    confirmTitle: '✅ Confirm & Create',
    plan: 'Plan',
    email: 'Email',
    shop: 'Shop',
    location: 'Location',
    card: 'Card',
    pendingNote: 'After signup your account will be on the free plan until payment is verified (within 24h).',
    createBtn: '🌸 Create My Shop',
    creating: 'Creating your shop...',
    back: '← Back',
    continue: 'Continue →',
    alreadyHave: 'Already have an account?',
    signIn: 'Sign in',
    pwLength: 'At least 8 characters',
    pwUpper: 'One uppercase letter (A-Z)',
    pwLower: 'One lowercase letter (a-z)',
    pwNumber: 'One number (0-9)',
    pwSpecial: 'One special character (!@#$...)',
    emailValid: '✓ Looks good!',
    emailInvalid: 'Please enter a valid email address',
    errEmail: 'Please enter a valid email address',
    errPassword: 'Please fix your password before continuing',
    errShopName: 'Please enter your shop name',
    errCard: 'Please fill in all card details',
    cardSecure: '🔒 Your card details are stored securely for manual verification only.',
    free: '(Free)',
    mostPopular: 'Most Popular',
  },
}

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
  const [lang, setLang] = useState<'uk' | 'en'>('uk')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as 'uk' | 'en'
    if (saved) setLang(saved)
  }, [])

  const toggleLang = () => {
    const next = lang === 'uk' ? 'en' : 'uk'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  const t = T[lang]
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
      if (!account.email || !emailValid) { setError(t.errEmail); return }
      if (!account.password || !pwAllGood) { setError(t.errPassword); return }
    }
    if (step === 3 && !shop.shopName.trim()) { setError(t.errShopName); return }
    if (step === 4 && isPaid) {
      if (!payment.cardHolderName || !payment.cardNumber || !payment.cardExpiry || !payment.cardCvc) {
        setError(t.errCard); return
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
      if (!response.ok) throw new Error(data.error || 'Signup failed')
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const pwCheckKeys = [
    { key: 'length', label: t.pwLength },
    { key: 'uppercase', label: t.pwUpper },
    { key: 'lowercase', label: t.pwLower },
    { key: 'number', label: t.pwNumber },
    { key: 'special', label: t.pwSpecial },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 md:p-8">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-sm text-gray-400 mt-1">{t.step} {step} {t.of} {totalSteps}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={toggleLang}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">
              {lang === 'uk' ? '🇺🇦 UA' : '🇬🇧 EN'}
              <span className="text-gray-300">|</span>
              {lang === 'uk' ? 'EN' : 'UA'}
            </button>
            {isPaid && (
              <div className="text-right">
                <div className="text-xs text-gray-400">{t.selectedPlan}</div>
                <div className="font-bold text-pink-600">{plan.name} — {plan.price} грн</div>
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="relative mb-6 h-2 w-full rounded-full bg-gray-100">
          <div className="absolute inset-y-0 left-0 rounded-full bg-pink-500 transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
        )}

        {/* Step 1 — Plan */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{t.step1Title}</h2>
            <p className="text-sm text-gray-400 mb-4">{t.step1Sub}</p>
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => (
                <button key={p.slug} type="button" onClick={() => setPlanSlug(p.slug)}
                  className={`relative flex flex-col rounded-xl border-2 p-4 text-left transition-all ${
                    p.slug === planSlug ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  {p.highlight && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-pink-500 text-white px-3 py-0.5 rounded-full font-semibold">{t.mostPopular}</span>}
                  <div className="text-2xl mb-2">{p.slug === 'free' ? '🌱' : p.slug === 'basic' ? '🌸' : '🌺'}</div>
                  <span className="font-bold text-gray-900 mb-1">{p.name}</span>
                  <span className="text-sm font-semibold text-pink-600 mb-2">{p.priceLabel}</span>
                  <p className="text-xs text-gray-500">{p.tagline}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Account */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{t.step2Title}</h2>
            <p className="text-sm text-gray-400 mb-4">{t.step2Sub}</p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t.emailLabel}</label>
              <input type="email" required value={account.email}
                onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
                onBlur={() => setEmailTouched(true)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                  emailTouched && account.email
                    ? emailValid ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                    : 'border-gray-200 focus:border-pink-400'
                }`}
                placeholder="you@example.com" />
              {emailTouched && account.email && (
                <p className={`text-xs mt-1 ${emailValid ? 'text-green-600' : 'text-red-600'}`}>
                  {emailValid ? t.emailValid : t.emailInvalid}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t.passwordLabel}</label>
              <input type="password" required value={account.password}
                onChange={e => { setAccount(p => ({ ...p, password: e.target.value })); setPasswordTouched(true) }}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                  passwordTouched && account.password
                    ? pwAllGood ? 'border-green-400 bg-green-50' : 'border-orange-300 bg-orange-50'
                    : 'border-gray-200 focus:border-pink-400'
                }`}
                placeholder={t.passwordPlaceholder} />
              {passwordTouched && (
                <div className="mt-2 space-y-1">
                  {pwCheckKeys.map(({ key, label }) => (
                    <div key={key} className={`flex items-center gap-2 text-xs ${pwChecks[key as keyof typeof pwChecks] ? 'text-green-600' : 'text-gray-400'}`}>
                      <span>{pwChecks[key as keyof typeof pwChecks] ? '✓' : '○'}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Shop */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{t.step3Title}</h2>
            <p className="text-sm text-gray-400 mb-4">{t.step3Sub}</p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t.shopNameLabel} <span className="text-red-400">*</span></label>
              <input type="text" required value={shop.shopName}
                onChange={e => setShop(p => ({ ...p, shopName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none"
                placeholder={t.shopNamePlaceholder} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t.locationLabel}</label>
              <input type="text" value={shop.location}
                onChange={e => setShop(p => ({ ...p, location: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none"
                placeholder={t.locationPlaceholder} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t.aboutLabel}</label>
              <textarea rows={3} value={shop.about}
                onChange={e => setShop(p => ({ ...p, about: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none resize-none"
                placeholder={t.aboutPlaceholder} />
            </div>
          </div>
        )}

        {/* Step 4 — Payment */}
        {step === 4 && isPaid && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{t.step4Title}</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">{plan.name} — {plan.price} грн/міс</p>
              <p>{t.paymentNote}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t.cardName}</label>
              <input type="text" name="cardHolderName" required value={payment.cardHolderName}
                onChange={handlePaymentInput}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none"
                placeholder={t.cardNamePlaceholder} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t.cardNumber}</label>
              <input type="text" name="cardNumber" required value={payment.cardNumber}
                onChange={handlePaymentInput}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none font-mono tracking-wider"
                placeholder="1234 5678 9012 3456" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.cardExpiry}</label>
                <input type="text" name="cardExpiry" required value={payment.cardExpiry}
                  onChange={handlePaymentInput}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none font-mono"
                  placeholder="MM/YY" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t.cardCvc}</label>
                <input type="text" name="cardCvc" required value={payment.cardCvc}
                  onChange={handlePaymentInput}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none font-mono"
                  placeholder="123" />
              </div>
            </div>
            <p className="text-xs text-gray-400">{t.cardSecure}</p>
          </div>
        )}

        {/* Final step — Confirm */}
        {((step === 4 && !isPaid) || (step === 5 && isPaid)) && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t.confirmTitle}</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm mb-4 border border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-500">{t.plan}</span>
                <span className="font-semibold">{plan.name} {isPaid ? `— ${plan.price} грн` : t.free}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.email}</span>
                <span>{account.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.shop}</span>
                <span className="font-semibold">{shop.shopName}</span>
              </div>
              {shop.location && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.location}</span>
                  <span>{shop.location}</span>
                </div>
              )}
              {isPaid && payment.cardNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.card}</span>
                  <span>•••• {payment.cardNumber.replace(/\s/g, '').slice(-4)}</span>
                </div>
              )}
            </div>
            {isPaid && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 mb-4">
                ⏳ {t.pendingNote}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md">
              {loading ? t.creating : t.createBtn}
            </button>
          </form>
        )}

        {/* Navigation */}
        {step < totalSteps && (
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
            <button type="button" onClick={() => { setError(''); setStep(p => p > 1 ? (p - 1) as any : p) }}
              disabled={step === 1}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30">
              {t.back}
            </button>
            <button type="button" onClick={handleContinue}
              className="bg-pink-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-pink-700 transition-colors">
              {t.continue}
            </button>
          </div>
        )}
        {step > 1 && step === totalSteps && (
          <div className="flex border-t border-gray-100 pt-4 mt-4">
            <button type="button" onClick={() => { setError(''); setStep(p => (p - 1) as any) }}
              className="text-sm text-gray-400 hover:text-gray-600">
              {t.back}
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-gray-400">
          {t.alreadyHave}{' '}
          <Link href="/login" className="font-semibold text-pink-600 hover:text-pink-700">{t.signIn}</Link>
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
