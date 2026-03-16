import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { formatDuration, getBaseUrl } from '@/lib/utils'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { DeleteEventTypeButton } from '@/components/DeleteEventTypeButton'
import { ToggleActiveButton } from '@/components/ToggleActiveButton'

export default async function EventTypesPage() {
  const session = await getServerSession(authOptions)
  const userId = (session!.user as any).id
  const username = (session!.user as any).username

  const eventTypes = await prisma.eventType.findMany({
    where: { userId },
    include: { _count: { select: { bookings: { where: { status: { not: 'CANCELLED' } } } } } },
    orderBy: { createdAt: 'asc' },
  })

  const baseUrl = getBaseUrl()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Types</h1>
          <p className="text-gray-500 mt-1">Define what meetings people can book with you</p>
        </div>
        <Link href="/dashboard/event-types/new" className="btn-primary">
          + New Event Type
        </Link>
      </div>

      {eventTypes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No event types yet</h2>
          <p className="text-gray-500 mb-6">Create your first event type to start accepting bookings.</p>
          <Link href="/dashboard/event-types/new" className="btn-primary">Create Event Type</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {eventTypes.map((et) => (
            <div key={et.id} className={`card p-5 flex items-center gap-4 ${!et.active ? 'opacity-60' : ''}`}>
              <div
                className="w-3 h-12 rounded-full flex-shrink-0"
                style={{ backgroundColor: et.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{et.title}</span>
                  {!et.active && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {formatDuration(et.duration)}
                  {et.description && ` · ${et.description}`}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {et._count.bookings} booking{et._count.bookings !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {et.active && (
                  <CopyLinkButton url={`${baseUrl}/${username}/${et.slug}`} />
                )}
                <ToggleActiveButton id={et.id} active={et.active} />
                <Link href={`/dashboard/event-types/${et.id}`} className="btn-secondary text-xs">
                  Edit
                </Link>
                <DeleteEventTypeButton id={et.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
