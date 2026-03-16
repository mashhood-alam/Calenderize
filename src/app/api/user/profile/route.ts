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
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id: true, name: true, email: true, username: true, timezone: true, image: true },
  })
  return NextResponse.json(user)
}

const schema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/).optional(),
  timezone: z.string().optional(),
})

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const userId = (session.user as any).id
  if (parsed.data.username) {
    const conflict = await prisma.user.findFirst({
      where: { username: parsed.data.username, NOT: { id: userId } },
    })
    if (conflict) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { id: true, name: true, email: true, username: true, timezone: true },
  })
  return NextResponse.json(user)
}
