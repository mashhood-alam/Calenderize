import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatDuration } from '@/lib/utils'
import { BookingFlow } from '@/components/BookingFlow'
import Image from 'next/image'

interface Props {
  params: { token: string }
}

export default async function ReschedulePage({ params }: Props) {
  const booking = await prisma.booking.findFirst({
    where: { rescheduleToken: params.token },
    include: {
      eventType: {
        include: {
          user: { select: { id: true, name: true, image: true, username: true } },
        },
      },
    },
  })

  if (!booking) notFound()

  if (booking.status === 'CANCELLED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900">Cannot Reschedule</h1>
          <p className="text-gray-500 mt-2">This meeting has been cancelled and cannot be rescheduled.</p>
        </div>
      </div>
    )
  }

  const { eventType } = booking
  const user = eventType.user

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <span className="text-sm font-medium text-gray-500">Calenderize</span>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-4xl">
          <div className="card p-6 mb-6 flex items-center gap-4">
            {user.image && (
              <Image src={user.image} alt={user.name || ''} width={56} height={56} className="rounded-full" />
            )}
            <div>
              <p className="text-sm text-gray-500">{user.name}</p>
              <h1 className="text-xl font-bold text-gray-900">Reschedule: {eventType.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Pick a new date and time for your meeting
              </p>
            </div>
          </div>

          <BookingFlow
            userId={user.id}
            eventTypeId={eventType.id}
            eventTitle={eventType.title}
            duration={eventType.duration}
            color={eventType.color}
            hostName={user.name || 'Host'}
            rescheduleToken={params.token}
          />
        </div>
      </div>
    </div>
  )
}
