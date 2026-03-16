import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'upcoming'

  const now = new Date()
  const where = filter === 'past'
    ? { endTime: { lt: now }, status: { not: 'CANCELLED' } }
    : { startTime: { gte: now }, status: { not: 'CANCELLED' } }

  const bookings = await prisma.booking.findMany({
    where: {
      eventType: { userId },
      ...where,
    },
    include: { eventType: { select: { title: true, color: true, slug: true } } },
    orderBy: { startTime: filter === 'past' ? 'desc' : 'asc' },
    take: 50,
  })
  return NextResponse.json(bookings)
}
