import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateSlotsForDate, getAvailableDatesInMonth } from '@/lib/slots'
import { parseISO, startOfDay, endOfDay } from 'date-fns'

// GET /api/availability/[userId]?eventTypeId=xxx&date=2024-01-15
// GET /api/availability/[userId]?eventTypeId=xxx&year=2024&month=0 (for calendar)
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const { searchParams } = new URL(req.url)
  const eventTypeId = searchParams.get('eventTypeId')
  const dateParam = searchParams.get('date')
  const yearParam = searchParams.get('year')
  const monthParam = searchParams.get('month')

  if (!eventTypeId) {
    return NextResponse.json({ error: 'eventTypeId required' }, { status: 400 })
  }

  const eventType = await prisma.eventType.findFirst({
    where: { id: eventTypeId, userId: params.userId, active: true },
  })
  if (!eventType) {
    return NextResponse.json({ error: 'Event type not found' }, { status: 404 })
  }

  const availability = await prisma.availability.findMany({
    where: { userId: params.userId },
    orderBy: { dayOfWeek: 'asc' },
  })

  // Return available days in a month
  if (yearParam !== null && monthParam !== null) {
    const year = parseInt(yearParam)
    const month = parseInt(monthParam)
    const availableDays = getAvailableDatesInMonth(year, month, availability)
    return NextResponse.json({ availableDays })
  }

  // Return time slots for a specific date
  if (dateParam) {
    const date = parseISO(dateParam)
    const existingBookings = await prisma.booking.findMany({
      where: {
        eventTypeId,
        startTime: { gte: startOfDay(date) },
        endTime: { lte: endOfDay(date) },
        status: { not: 'CANCELLED' },
      },
    })

    const slots = generateSlotsForDate(date, eventType.duration, availability, existingBookings)
    return NextResponse.json({ slots: slots.map(s => ({
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      label: s.label,
    })) })
  }

  return NextResponse.json({ error: 'Provide date or year+month' }, { status: 400 })
}
