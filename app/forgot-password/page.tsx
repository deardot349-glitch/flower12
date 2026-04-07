'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json()
        setErrorMsg(data.error || 'Щось пішло не так')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Помилка мережі. Спробуйте ще раз.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left dark panel ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] bg-gray-950 flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 60%, #ec4899 0%, transparent 55%),
              radial-gradient(circle at 75% 30%, #a855f7 0%, transparent 55%)`,
          }}
        />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`, backgroundSize: '28px 28px' }}
        />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-lg shadow-lg">🌸</div>
            <span className="text-white font-bold text-xl tracking-tight">FlowerGoUa</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
              <Mail className="w-8 h-8 text-pink-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
              Відновлення доступу до магазину
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Надішлемо посилання для скидання пароля на вашу електронну пошту.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              {[
                { step: '01', text: 'Введіть email вашого акаунту' },
                { step: '02', text: 'Перевірте вхідні повідомлення (або папку Спам)' },
                { step: '03', text: 'Перейдіть за посиланням і створіть новий пароль' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-[11px] font-bold text-pink-400 flex-shrink-0">
                    {step}
                  </div>
                  <p className="text-gray-400 text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} FlowerGoUa</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-2xl">🌸</span>
              <span className="font-bold text-xl text-gray-900">FlowerGoUa</span>
            </Link>
          </div>

          {status === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Перевірте пошту!</h1>
              <p className="text-gray-500 text-sm mb-2">
                Якщо акаунт з адресою
              </p>
              <p className="font-semibold text-gray-900 text-sm mb-4">{email}</p>
              <p className="text-gray-500 text-sm mb-8">
                існує — ви отримаєте посилання для скидання пароля протягом кількох хвилин.
              </p>
              <Button asChild className="w-full h-11">
                <Link href="/login">
                  <ArrowLeft className="w-4 h-4" /> Повернутись до входу
                </Link>
              </Button>
              <p className="mt-4 text-xs text-gray-400">
                Не отримали листа? Перевірте папку «Спам» або{' '}
                <button onClick={() => setStatus('idle')} className="text-pink-600 font-semibold hover:underline">
                  спробуйте ще раз
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Забули пароль?</h1>
                <p className="text-gray-500 text-sm">Введіть email і ми надішлемо посилання для відновлення</p>
              </div>

              {status === 'error' && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Електронна пошта</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <Button type="submit" disabled={status === 'loading'} className="w-full h-11">
                  {status === 'loading'
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Надсилаємо...</>
                    : <>Надіслати посилання <ArrowRight className="w-4 h-4" /></>
                  }
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Повернутись до входу
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
