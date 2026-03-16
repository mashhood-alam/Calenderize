import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatDuration } from '@/lib/utils'
import { BookingFlow } from '@/components/BookingFlow'
import Image from 'next/image'

interface Props {
  params: { username: string; slug: string }
}

export default async function BookingPage({ params }: Props) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: { id: true, name: true, image: true, username: true },
  })
  if (!user) notFound()

  const eventType = await prisma.eventType.findFirst({
    where: { userId: user.id, slug: params.slug, active: true },
  })
  if (!eventType) notFound()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Calenderize</span>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-4xl">
          {/* Event info card */}
          <div className="card p-6 mb-6 flex items-center gap-4">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name || ''}
                width={56}
                height={56}
                className="rounded-full flex-shrink-0"
              />
            )}
            <div>
              <p className="text-sm text-gray-500">{user.name}</p>
              <h1 className="text-xl font-bold text-gray-900">{eventType.title}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">⏱ {formatDuration(eventType.duration)}</span>
                {eventType.description && (
                  <span className="text-sm text-gray-500">{eventType.description}</span>
                )}
              </div>
            </div>
          </div>

          <BookingFlow
            userId={user.id}
            eventTypeId={eventType.id}
            eventTitle={eventType.title}
            duration={eventType.duration}
            color={eventType.color}
            hostName={user.name || 'Host'}
          />
        </div>
      </div>
    </div>
  )
}
