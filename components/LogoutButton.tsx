'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
    >
      Вийти
    </button>
  )
}
