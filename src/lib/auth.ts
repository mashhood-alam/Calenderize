import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/calendar',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  session: { strategy: 'database' },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Fetch username and attach to session
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true },
        })
        ;(session.user as any).username = dbUser?.username
      }
      return session
    },
    async signIn({ user }) {
      // Auto-assign username if missing
      if (user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          select: { username: true },
        })
        if (!existing?.username) {
          const base = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
          let username = base
          let suffix = 1
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${base}${suffix++}`
          }
          await prisma.user.update({
            where: { email: user.email },
            data: { username },
          })
          // Seed default availability Mon-Fri 9-17
          const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
          if (dbUser) {
            const daysExist = await prisma.availability.count({ where: { userId: dbUser.id } })
            if (daysExist === 0) {
              const defaultDays = [1, 2, 3, 4, 5] // Mon-Fri
              await prisma.availability.createMany({
                data: defaultDays.map((day) => ({
                  userId: dbUser.id,
                  dayOfWeek: day,
                  startTime: '09:00',
                  endTime: '17:00',
                  enabled: true,
                })),
              })
              // Also seed Sun + Sat as disabled
              await prisma.availability.createMany({
                data: [0, 6].map((day) => ({
                  userId: dbUser.id,
                  dayOfWeek: day,
                  startTime: '09:00',
                  endTime: '17:00',
                  enabled: false,
                })),
              })
              // Seed a default event type
              await prisma.eventType.create({
                data: {
                  userId: dbUser.id,
                  title: '30 Minute Meeting',
                  slug: '30min',
                  description: 'A quick 30-minute meeting.',
                  duration: 30,
                  color: '#3b82f6',
                },
              })
            }
          }
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
}
