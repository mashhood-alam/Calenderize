import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { slugify } from '@/lib/utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const eventTypes = await prisma.eventType.findMany({
    where: { userId },
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(eventTypes)
}

const schema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  duration: z.number().min(5).max(480),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const slug = parsed.data.slug || slugify(parsed.data.title)
  const conflict = await prisma.eventType.findUnique({
    where: { userId_slug: { userId, slug } },
  })
  if (conflict) {
    return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const eventType = await prisma.eventType.create({
    data: {
      userId,
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      duration: parsed.data.duration,
      color: parsed.data.color || '#3b82f6',
    },
  })
  return NextResponse.json(eventType, { status: 201 })
}
