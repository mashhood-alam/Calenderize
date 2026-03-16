import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

interface Props {
  params: { token: string }
}

export default async function BookingDetailPage({ params }: Props) {
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ cancelToken: params.token }, { rescheduleToken: params.token }],
    },
    include: {
      eventType: {
        include: { user: { select: { name: true, username: true } } },
      },
    },
  })

  if (!booking) notFound()

  const isCancelled = booking.status === 'CANCELLED'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{isCancelled ? '❌' : '✅'}</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isCancelled ? 'Meeting Cancelled' : 'Meeting Confirmed'}
          </h1>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Event</span>
            <span className="font-medium text-gray-900">{booking.eventType.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Host</span>
            <span className="font-medium text-gray-900">{booking.eventType.user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-medium text-gray-900">{format(booking.startTime, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span className="font-medium text-gray-900">
              {format(booking.startTime, 'h:mm a')} – {format(booking.endTime, 'h:mm a')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className={`font-medium ${isCancelled ? 'text-red-600' : 'text-green-600'}`}>
              {booking.status}
            </span>
          </div>
        </div>

        {!isCancelled && (
          <div className="flex gap-3">
            <Link
              href={`/booking/${booking.rescheduleToken}/reschedule`}
              className="btn-secondary flex-1 text-center"
            >
              Reschedule
            </Link>
            <Link
              href={`/booking/${booking.cancelToken}/cancel`}
              className="btn-danger flex-1 text-center"
            >
              Cancel
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
