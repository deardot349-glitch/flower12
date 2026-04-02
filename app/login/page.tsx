'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '' })

  useEffect(() => {
    // ?registered=true  — came from signup page
    if (searchParams.get('registered') === 'true') {
      setInfo('Акаунт створено! Перевірте email та підтвердіть адресу, потім увійдіть.')
    }
    // ?verified=1  — came from clicking the verification link in the email
    if (searchParams.get('verified') === '1') {
      setInfo('Email підтверджено! Тепер можна увійти.')
    }
    // ?error=...  — various redirect-based errors
    const err = searchParams.get('error')
    if (err === 'missing_token' || err === 'invalid_token') {
      setError('Посилання для підтвердження недійсне або протерміноване. Спробуйте зареєструватися знову.')
    }
    if (err === 'server_error') {
      setError('Сталася помилка. Спробуйте ще раз.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    try {
      const result = await signIn('credentials', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        // NextAuth passes the throw message as the error string
        if (result.error === 'EmailNotVerified') {
          setError('Будь ласка, підтвердіть ваш email перед входом. Перевірте папку "Вхідні" (або "Спам").')
        } else {
          setError('Невірний email або пароль.')
        }
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Щось пішло не так. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="text-4xl mb-3">🌸</div>
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
              FlowerGoUa
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">З поверненням!</h1>
          <p className="text-gray-500 mt-1 text-sm">Увійдіть щоб керувати вашим квітковим магазином</p>
        </div>

        {info && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
            ✅ {info}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-semibold text-gray-700">Пароль</label>
              <Link href="/forgot-password" className="text-xs text-pink-500 hover:text-pink-600">
                Забули пароль?
              </Link>
            </div>
            <input
              type="password" required value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-md text-sm">
            {loading ? 'Входимо...' : 'Увійти'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Немає акаунту?{' '}
          <Link href="/signup" className="text-pink-600 hover:text-pink-700 font-semibold">Створити</Link>
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
