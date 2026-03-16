import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { sendBookingConfirmation } from '@/lib/email'
import { getBaseUrl } from '@/lib/utils'
import { addMinutes, parseISO } from 'date-fns'

const schema = z.object({
  newStartTime: z.string(),
})

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const booking = await prisma.booking.findFirst({
    where: { rescheduleToken: params.token },
    include: {
      eventType: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  if (booking.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Cannot reschedule a cancelled booking' }, { status: 400 })
  }

  const newStartTime = parseISO(parsed.data.newStartTime)
  const newEndTime = addMinutes(newStartTime, booking.eventType.duration)

  // Check conflicts (excluding current booking)
  const conflict = await prisma.booking.findFirst({
    where: {
      eventTypeId: booking.eventTypeId,
      id: { not: booking.id },
      status: { not: 'CANCELLED' },
      OR: [
        { startTime: { lt: newEndTime, gte: newStartTime } },
        { endTime: { gt: newStartTime, lte: newEndTime } },
        { startTime: { lte: newStartTime }, endTime: { gte: newEndTime } },
      ],
    },
  })
  if (conflict) {
    return NextResponse.json({ error: 'Time slot no longer available' }, { status: 409 })
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      startTime: newStartTime,
      endTime: newEndTime,
      status: 'CONFIRMED',
    },
  })

  try {
    await sendBookingConfirmation({
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      hostName: booking.eventType.user.name || 'Host',
      hostEmail: booking.eventType.user.email || '',
      eventTitle: `[Rescheduled] ${booking.eventType.title}`,
      startTime: newStartTime,
      endTime: newEndTime,
      cancelToken: booking.cancelToken,
      rescheduleToken: booking.rescheduleToken,
      baseUrl: getBaseUrl(),
    })
  } catch (err) {
    console.error('Reschedule email failed:', err)
  }

  return NextResponse.json({ ok: true, newStartTime: updated.startTime })
}
