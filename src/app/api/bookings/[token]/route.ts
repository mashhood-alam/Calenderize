import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Fetch booking by cancelToken or rescheduleToken
export async function GET(_: Request, { params }: { params: { token: string } }) {
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ cancelToken: params.token }, { rescheduleToken: params.token }],
    },
    include: {
      eventType: {
        include: { user: { select: { id: true, name: true, email: true, username: true } } },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  return NextResponse.json(booking)
}
