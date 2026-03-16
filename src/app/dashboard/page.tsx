import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { format } from 'date-fns'
import { getBaseUrl, formatDuration } from '@/lib/utils'
import { CopyLinkButton } from '@/components/CopyLinkButton'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session!.user as any).id
  const username = (session!.user as any).username

  const [eventTypes, upcomingBookings] = await Promise.all([
    prisma.eventType.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.booking.findMany({
      where: {
        eventType: { userId },
        startTime: { gte: new Date() },
        status: { not: 'CANCELLED' },
      },
      include: { eventType: { select: { title: true, color: true } } },
      orderBy: { startTime: 'asc' },
      take: 10,
    }),
  ])

  const baseUrl = getBaseUrl()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your event types and bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</div>
          <div className="text-sm text-gray-500 mt-1">Upcoming meetings</div>
        </div>
        <div className="card p-5">
          <div className="text-2xl font-bold text-gray-900">{eventTypes.length}</div>
          <div className="text-sm text-gray-500 mt-1">Event types</div>
        </div>
        <div className="card p-5">
          <div className="text-sm font-medium text-gray-500 mb-1">Your booking page</div>
          <div className="text-sm text-brand-600 font-mono truncate">
            {baseUrl}/{username}
          </div>
        </div>
      </div>

      {/* Event Types */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Event Types</h2>
          <Link href="/dashboard/event-types/new" className="btn-primary text-sm">
            + New Event Type
          </Link>
        </div>

        {eventTypes.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            <p>No event types yet.</p>
            <Link href="/dashboard/event-types/new" className="btn-primary mt-4 inline-block">
              Create your first event type
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {eventTypes.map((et) => (
              <div key={et.id} className="card p-4 flex items-center gap-4">
                <div
                  className="w-3 h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: et.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{et.title}</div>
                  <div className="text-sm text-gray-500">{formatDuration(et.duration)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <CopyLinkButton url={`${baseUrl}/${username}/${et.slug}`} />
                  <Link
                    href={`/dashboard/event-types/${et.id}`}
                    className="btn-secondary text-xs"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h2>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="card p-6 text-center text-gray-500 text-sm">
            No upcoming meetings.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="card p-4 flex items-center gap-4">
                <div
                  className="w-2 h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: b.eventType.color }}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{b.guestName}</div>
                  <div className="text-sm text-gray-500">{b.eventType.title}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium text-gray-900">
                    {format(b.startTime, 'MMM d, yyyy')}
                  </div>
                  <div className="text-gray-500">
                    {format(b.startTime, 'h:mm a')} – {format(b.endTime, 'h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
