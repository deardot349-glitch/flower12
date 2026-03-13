'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WrappingRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/assortment?tab=wrapping') }, [router])
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Перенаправляємо до Асортименту...</p>
      </div>
    </div>
  )
}
