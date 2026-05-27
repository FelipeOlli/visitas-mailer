'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="px-3 py-1.5 rounded-lg text-xs text-[#525252] hover:text-[#fafafa] hover:bg-[#1a1a1a] transition-all"
    >
      Sair
    </button>
  )
}
