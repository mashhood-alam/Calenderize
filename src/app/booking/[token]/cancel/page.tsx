'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Booking {
  id: string
  guestName: string
  startTime: string
  endTime: string
  status: string
  eventType: { title: string; user: { name: string } }
}

export default function CancelPage() {
  const { token } = useParams() as { token: string }
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/bookings/${token}`)
      .then((r) => r.json())
      .then((data) => {
        setBooking(data)
        setLoading(false)
        if (data.status === 'CANCELLED') setCancelled(true)
      })
      .catch(() => setLoading(false))
  }, [token])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return
    setCancelling(true)
    const res = await fetch(`/api/bookings/${token}/cancel`, { method: 'POST' })
    if (res.ok) {
      setCancelled(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to cancel')
    }
    setCancelling(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">❓</div>
          <h1 className="text-xl font-bold text-gray-900">Booking not found</h1>
          <p className="text-gray-500 mt-2">This cancellation link may be invalid or expired.</p>
        </div>
      </div>
    )
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900">Meeting Cancelled</h1>
          <p className="text-gray-500 mt-3">
            Your meeting with {booking.eventType.user.name} has been cancelled.
            A confirmation email has been sent.
          </p>
        </div>
      </div>
    )
  }

  const startTime = new Date(booking.startTime)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cancel Meeting</h1>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Event</span>
            <span className="font-medium">{booking.eventType.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">With</span>
            <span className="font-medium">{booking.eventType.user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-medium">{format(startTime, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span className="font-medium">{format(startTime, 'h:mm a')}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to cancel this meeting? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button onClick={handleCancel} disabled={cancelling} className="btn-danger flex-1">
            {cancelling ? 'Cancelling...' : 'Yes, Cancel Meeting'}
          </button>
          <a href={`/booking/${token}`} className="btn-secondary flex-1 text-center">
            Keep Meeting
          </a>
        </div>
      </div>
    </div>
  )
}
