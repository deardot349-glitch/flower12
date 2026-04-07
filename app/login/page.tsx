'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  useEffect(() => {
    if (searchParams.get('registered') === 'true') setInfo('Акаунт створено! Тепер можна увійти.')
    if (searchParams.get('verified') === '1') setInfo('Email підтверджено! Тепер можна увійти.')
    const err = searchParams.get('error')
    if (err === 'missing_token' || err === 'invalid_token')
      setError('Посилання для підтвердження недійсне або протерміноване.')
    if (err === 'server_error') setError('Сталася помилка. Спробуйте ще раз.')
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
        setError(result.error === 'EmailNotVerified'
          ? 'Будь ласка, підтвердіть ваш email перед входом.'
          : 'Невірний email або пароль.')
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
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] bg-gray-950 flex-col relative overflow-hidden">
        {/* Botanical background pattern */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #ec4899 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, #a855f7 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, #f97316 0%, transparent 40%)`,
          }}
        />
        <div className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 w-fit">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
              🌸
            </div>
            <span className="text-white font-bold text-xl tracking-tight">FlowerGoUa</span>
          </Link>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="mb-8">
              <div className="text-6xl mb-6">💐</div>
              <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
                Керуйте квітковим магазином як справжній бізнес
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Замовлення, асортимент, Telegram-сповіщення — все в одному місці.
              </p>
            </div>

            {/* Testimonial */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                «За перший місяць отримала 40+ замовлень через сторінку. Клієнти кажуть що дуже зручно.»
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  О
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Оксана Литвин</p>
                  <p className="text-gray-500 text-xs">Квіткова Хата, Львів</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} FlowerGoUa</p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-2xl">🌸</span>
              <span className="font-bold text-xl text-gray-900">FlowerGoUa</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">З поверненням</h1>
            <p className="text-gray-500 text-sm">Введіть ваші дані для входу</p>
          </div>

          {info && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {info}
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Пароль</Label>
                <Link href="/forgot-password" className="text-xs text-pink-600 hover:text-pink-700 font-medium">
                  Забули пароль?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11" size="default">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Входимо...</>
                : <>'Увійти <ArrowRight className="h-4 w-4" /></>
              }
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Немає акаунту?{' '}
            <Link href="/signup" className="text-pink-600 hover:text-pink-700 font-semibold">
              Створити безкоштовно
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
