'use client'
import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="w-full btn-secondary text-xs"
    >
      Sign out
    </button>
  )
}
