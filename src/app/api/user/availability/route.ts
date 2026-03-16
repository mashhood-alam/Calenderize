import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const availability = await prisma.availability.findMany({
    where: { userId },
    orderBy: { dayOfWeek: 'asc' },
  })
  return NextResponse.json(availability)
}

const ruleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  enabled: z.boolean(),
})

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const body = await req.json()
  const rules = z.array(ruleSchema).safeParse(body)
  if (!rules.success) {
    return NextResponse.json({ error: rules.error.flatten() }, { status: 400 })
  }

  // Upsert each day
  await Promise.all(
    rules.data.map((rule) =>
      prisma.availability.upsert({
        where: { userId_dayOfWeek: { userId, dayOfWeek: rule.dayOfWeek } },
        create: { userId, ...rule },
        update: { startTime: rule.startTime, endTime: rule.endTime, enabled: rule.enabled },
      })
    )
  )

  const updated = await prisma.availability.findMany({
    where: { userId },
    orderBy: { dayOfWeek: 'asc' },
  })
  return NextResponse.json(updated)
}
