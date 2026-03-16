'use client'
import { useState, useEffect, useCallback } from 'react'
import { format, addMonths, subMonths, startOfMonth, getDaysInMonth, getDay } from 'date-fns'

interface Slot {
  startTime: string
  endTime: string
  label: string
}

interface Props {
  userId: string
  eventTypeId: string
  eventTitle: string
  duration: number
  color: string
  hostName: string
  initialStartTime?: string // for rescheduling
  rescheduleToken?: string
}

type Step = 'pick-date' | 'pick-time' | 'details' | 'confirmed'

export function BookingFlow({ userId, eventTypeId, eventTitle, duration, color, hostName, initialStartTime, rescheduleToken }: Props) {
  const [step, setStep] = useState<Step>('pick-date')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableDays, setAvailableDays] = useState<number[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingDays, setLoadingDays] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmedData, setConfirmedData] = useState<{ cancelToken: string; rescheduleToken: string } | null>(null)

  const fetchAvailableDays = useCallback(async (month: Date) => {
    setLoadingDays(true)
    const res = await fetch(
      `/api/availability/${userId}?eventTypeId=${eventTypeId}&year=${month.getFullYear()}&month=${month.getMonth()}`
    )
    const data = await res.json()
    setAvailableDays(data.availableDays || [])
    setLoadingDays(false)
  }, [userId, eventTypeId])

  useEffect(() => {
    fetchAvailableDays(currentMonth)
  }, [currentMonth, fetchAvailableDays])

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date)
    setLoadingSlots(true)
    setStep('pick-time')
    const dateStr = format(date, 'yyyy-MM-dd')
    const res = await fetch(`/api/availability/${userId}?eventTypeId=${eventTypeId}&date=${dateStr}`)
    const data = await res.json()
    setSlots(data.slots || [])
    setLoadingSlots(false)
  }

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot)
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return
    setSubmitting(true)
    setError('')

    if (rescheduleToken) {
      // Rescheduling
      const res = await fetch(`/api/bookings/${rescheduleToken}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStartTime: selectedSlot.startTime }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to reschedule')
        setSubmitting(false)
        return
      }
      setStep('confirmed')
    } else {
      // New booking
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTypeId,
          guestName: form.name,
          guestEmail: form.email,
          startTime: selectedSlot.startTime,
          notes: form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to book')
        setSubmitting(false)
        return
      }
      setConfirmedData(data)
      setStep('confirmed')
    }
    setSubmitting(false)
  }

  // Calendar rendering
  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getDay(startOfMonth(currentMonth))
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return (
      <div className="card p-6">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <h2 className="font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        {loadingDays ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first week */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(year, month, day)
              const isPast = date < today
              const isAvailable = availableDays.includes(day) && !isPast
              const isSelected = selectedDate?.getDate() === day &&
                selectedDate?.getMonth() === month &&
                selectedDate?.getFullYear() === year

              return (
                <button
                  key={day}
                  onClick={() => isAvailable && handleDateSelect(date)}
                  disabled={!isAvailable}
                  className={`aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center
                    ${isSelected ? 'text-white' : ''}
                    ${isAvailable && !isSelected ? 'hover:bg-brand-50 text-gray-900 cursor-pointer' : ''}
                    ${!isAvailable ? 'text-gray-300 cursor-not-allowed' : ''}
                  `}
                  style={isSelected ? { backgroundColor: color } : undefined}
                >
                  {day}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (step === 'confirmed') {
    const startTime = selectedSlot ? new Date(selectedSlot.startTime) : null
    return (
      <div className="card p-8 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: color + '20' }}>
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {rescheduleToken ? 'Meeting Rescheduled!' : 'Booking Confirmed!'}
        </h2>
        {startTime && (
          <p className="text-gray-500 mb-6">
            {format(startTime, "EEEE, MMMM d 'at' h:mm a")}
          </p>
        )}
        <p className="text-sm text-gray-500">
          {rescheduleToken
            ? 'Your meeting has been rescheduled. A confirmation email has been sent.'
            : 'A confirmation email with cancel/reschedule links has been sent to your inbox.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Calendar + Date selection */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Select a Date
        </h2>
        {renderCalendar()}
      </div>

      {/* Right: Time slots or booking form */}
      <div>
        {step === 'pick-date' && (
          <div className="card p-6 flex items-center justify-center h-64 text-gray-400 text-sm">
            Select a date to see available times
          </div>
        )}

        {step === 'pick-time' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              {selectedDate && format(selectedDate, 'EEEE, MMMM d')}
            </h2>
            <div className="card p-4">
              {loadingSlots ? (
                <div className="py-8 text-center text-gray-400 text-sm">Loading times...</div>
              ) : slots.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  No available times on this day
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      onClick={() => handleSlotSelect(slot)}
                      className="py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-colors hover:border-brand-500 hover:text-brand-600"
                      style={{ borderColor: color + '40' }}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setStep('pick-date'); setSelectedDate(null) }}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Change date
            </button>
          </div>
        )}

        {step === 'details' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Your Details
            </h2>
            <div className="card p-5 mb-3 bg-brand-50 border-brand-200">
              <p className="text-sm font-medium text-brand-900">
                {selectedDate && format(selectedDate, 'EEEE, MMMM d')}
                {' at '}
                {selectedSlot?.label}
              </p>
              <p className="text-xs text-brand-700 mt-0.5">{duration} minutes with {hostName}</p>
            </div>

            <form onSubmit={handleSubmit} className="card p-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!rescheduleToken && (
                <>
                  <div>
                    <label className="label">Your Name</label>
                    <input
                      className="input"
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="jane@example.com"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Additional Notes (optional)</label>
                    <textarea
                      className="input resize-none"
                      rows={2}
                      placeholder="Anything I should know before our meeting?"
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn-primary flex-1"
                  style={{ backgroundColor: color }}>
                  {submitting ? 'Confirming...' : rescheduleToken ? 'Confirm Reschedule' : 'Confirm Booking'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('pick-time')}
                  className="btn-secondary"
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
