'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-gray-600 hover:text-gray-900 font-medium"
    >
      Sign Out
    </button>
  )
}
