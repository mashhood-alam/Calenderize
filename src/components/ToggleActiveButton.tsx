'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ToggleActiveButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    await fetch(`/api/user/event-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={handleToggle} disabled={loading} className="btn-secondary text-xs">
      {loading ? '...' : active ? 'Disable' : 'Enable'}
    </button>
  )
}
