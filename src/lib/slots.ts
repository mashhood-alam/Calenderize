import {
  startOfDay,
  endOfDay,
  addMinutes,
  isBefore,
  isAfter,
  parseISO,
  format,
  setHours,
  setMinutes,
} from 'date-fns'

export interface TimeSlot {
  startTime: Date
  endTime: Date
  label: string
}

export interface AvailabilityRule {
  dayOfWeek: number
  startTime: string // "09:00"
  endTime: string   // "17:00"
  enabled: boolean
}

export interface ExistingBooking {
  startTime: Date
  endTime: Date
  status: string
}

export function generateSlotsForDate(
  date: Date,
  durationMinutes: number,
  availability: AvailabilityRule[],
  existingBookings: ExistingBooking[]
): TimeSlot[] {
  const dayOfWeek = date.getDay()
  const rule = availability.find((a) => a.dayOfWeek === dayOfWeek)

  if (!rule || !rule.enabled) return []

  const [startHour, startMin] = rule.startTime.split(':').map(Number)
  const [endHour, endMin] = rule.endTime.split(':').map(Number)

  const dayStart = setMinutes(setHours(startOfDay(date), startHour), startMin)
  const dayEnd = setMinutes(setHours(startOfDay(date), endHour), endMin)

  const slots: TimeSlot[] = []
  let current = dayStart

  const now = new Date()

  while (isBefore(addMinutes(current, durationMinutes), dayEnd) ||
         addMinutes(current, durationMinutes).getTime() === dayEnd.getTime()) {
    const slotEnd = addMinutes(current, durationMinutes)

    // Skip past slots (add 15 min buffer)
    if (isBefore(current, addMinutes(now, 15))) {
      current = addMinutes(current, 15)
      // Snap to next clean interval
      const mins = current.getMinutes()
      const snap = durationMinutes <= 15 ? 15 : durationMinutes <= 30 ? 30 : 60
      const remainder = mins % snap
      if (remainder !== 0) {
        current = addMinutes(current, snap - remainder)
      }
      continue
    }

    // Check for conflicts with existing bookings
    const hasConflict = existingBookings.some((booking) => {
      if (booking.status === 'CANCELLED') return false
      return (
        isBefore(current, booking.endTime) && isAfter(slotEnd, booking.startTime)
      )
    })

    if (!hasConflict) {
      slots.push({
        startTime: new Date(current),
        endTime: new Date(slotEnd),
        label: format(current, 'h:mm a'),
      })
    }

    current = addMinutes(current, durationMinutes)
  }

  return slots
}

export function getAvailableDatesInMonth(
  year: number,
  month: number, // 0-based
  availability: AvailabilityRule[]
): number[] {
  const enabledDays = availability
    .filter((a) => a.enabled)
    .map((a) => a.dayOfWeek)

  const available: number[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    if (isBefore(d, today)) continue
    if (enabledDays.includes(d.getDay())) {
      available.push(day)
    }
  }

  return available
}
