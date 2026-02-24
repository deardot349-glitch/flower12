'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const T = {
  uk: {
    title: 'З поверненням!',
    subtitle: 'Увійдіть щоб керувати вашим квітковим магазином',
    email: 'Email',
    password: 'Пароль',
    submit: 'Увійти',
    loading: 'Входимо...',
    noAccount: 'Немає акаунту?',
    createOne: 'Створити',
    success: 'Акаунт створено! Тепер можна увійти.',
    error: 'Невірний email або пароль',
    forgot: 'Забули пароль?',
  },
  en: {
    title: 'Welcome Back!',
    subtitle: 'Sign in to manage your flower shop',
    email: 'Email',
    password: 'Password',
    submit: 'Sign In',
    loading: 'Signing in...',
    noAccount: "Don't have an account?",
    createOne: 'Create one',
    success: 'Account created! You can now sign in.',
    error: 'Invalid email or password',
    forgot: 'Forgot password?',
  },
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [lang, setLang] = useState<'uk' | 'en'>('uk')
  const t = T[lang]

  const [formData, setFormData] = useState({ email: '', password: '' })

  useEffect(() => {
    if (searchParams.get('registered') === 'true') setSuccess(true)
    const saved = localStorage.getItem('lang') as 'uk' | 'en'
    if (saved) setLang(saved)
  }, [searchParams])

  const toggleLang = () => {
    const next = lang === 'uk' ? 'en' : 'uk'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const result = await signIn('credentials', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      })
      if (result?.error) throw new Error(t.error)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        {/* Language switcher */}
        <div className="flex justify-end mb-4">
          <button onClick={toggleLang}
            className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">
            {lang === 'uk' ? '🇺🇦 UA' : '🇬🇧 EN'}
            <span className="text-gray-300">|</span>
            {lang === 'uk' ? 'EN' : 'UA'}
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌸</div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t.subtitle}</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
            ✅ {t.success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t.email}</label>
            <input type="email" required value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none text-sm"
              placeholder="you@example.com" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-semibold text-gray-700">{t.password}</label>
              <Link href="/forgot-password" className="text-xs text-pink-500 hover:text-pink-600">{t.forgot}</Link>
            </div>
            <input type="password" required value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none text-sm"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-md">
            {loading ? t.loading : t.submit}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t.noAccount}{' '}
          <Link href="/signup" className="text-pink-600 hover:text-pink-700 font-semibold">{t.createOne}</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
