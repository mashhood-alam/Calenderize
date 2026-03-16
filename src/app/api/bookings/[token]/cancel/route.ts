import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendCancellationEmail } from '@/lib/email'

export async function POST(_: Request, { params }: { params: { token: string } }) {
  const booking = await prisma.booking.findFirst({
    where: { cancelToken: params.token },
    include: {
      eventType: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  if (booking.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'CANCELLED' },
  })

  try {
    await sendCancellationEmail({
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      hostName: booking.eventType.user.name || 'Host',
      hostEmail: booking.eventType.user.email || '',
      eventTitle: booking.eventType.title,
      startTime: booking.startTime,
    })
  } catch (err) {
    console.error('Cancellation email failed:', err)
  }

  return NextResponse.json({ ok: true })
}
