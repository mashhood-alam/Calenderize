import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { sendBookingConfirmation } from '@/lib/email'
import { getBaseUrl } from '@/lib/utils'
import { addMinutes, parseISO } from 'date-fns'

const schema = z.object({
  eventTypeId: z.string(),
  guestName: z.string().min(1).max(100),
  guestEmail: z.string().email(),
  startTime: z.string(), // ISO string
  notes: z.string().max(1000).optional(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { eventTypeId, guestName, guestEmail, startTime: startTimeStr, notes } = parsed.data

  const eventType = await prisma.eventType.findFirst({
    where: { id: eventTypeId, active: true },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  if (!eventType) {
    return NextResponse.json({ error: 'Event type not found' }, { status: 404 })
  }

  const startTime = parseISO(startTimeStr)
  const endTime = addMinutes(startTime, eventType.duration)

  // Double-check for conflicts
  const conflict = await prisma.booking.findFirst({
    where: {
      eventTypeId,
      status: { not: 'CANCELLED' },
      OR: [
        { startTime: { lt: endTime, gte: startTime } },
        { endTime: { gt: startTime, lte: endTime } },
        { startTime: { lte: startTime }, endTime: { gte: endTime } },
      ],
    },
  })
  if (conflict) {
    return NextResponse.json({ error: 'Time slot no longer available' }, { status: 409 })
  }

  const booking = await prisma.booking.create({
    data: {
      eventTypeId,
      guestName,
      guestEmail,
      startTime,
      endTime,
      notes,
      status: 'CONFIRMED',
    },
  })

  // Send confirmation email
  try {
    await sendBookingConfirmation({
      guestName,
      guestEmail,
      hostName: eventType.user.name || 'Host',
      hostEmail: eventType.user.email || '',
      eventTitle: eventType.title,
      startTime,
      endTime,
      cancelToken: booking.cancelToken,
      rescheduleToken: booking.rescheduleToken,
      baseUrl: getBaseUrl(),
      notes,
    })
  } catch (err) {
    console.error('Email send failed:', err)
  }

  return NextResponse.json(
    {
      id: booking.id,
      cancelToken: booking.cancelToken,
      rescheduleToken: booking.rescheduleToken,
    },
    { status: 201 }
  )
}
