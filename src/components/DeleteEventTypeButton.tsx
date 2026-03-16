'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteEventTypeButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this event type? All associated bookings will also be deleted.')) return
    setLoading(true)
    await fetch(`/api/user/event-types/${id}`, { method: 'DELETE' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn-danger text-xs">
      {loading ? '...' : 'Delete'}
    </button>
  )
}
