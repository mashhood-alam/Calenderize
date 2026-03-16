import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-brand-600">Calenderize</span>
          <Link href="/auth/signin" className="btn-primary">Sign in with Google</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            Scheduling that works for you
          </h1>
          <p className="text-xl text-gray-500 mb-10">
            Share your availability, let anyone book time with you. No back-and-forth emails.
            Guests can reschedule or cancel with one click.
          </p>
          <Link href="/auth/signin" className="btn-primary text-base px-8 py-3">
            Get Started – It&apos;s Free
          </Link>

          <div className="mt-20 grid grid-cols-3 gap-8 text-left">
            {[
              { icon: '📅', title: 'Set your hours', desc: 'Choose which days and times you are available.' },
              { icon: '🔗', title: 'Share your link', desc: 'Send your booking page to anyone to let them pick a slot.' },
              { icon: '✅', title: 'Get booked', desc: 'Receive confirmation emails and manage all your meetings.' },
            ].map((f) => (
              <div key={f.title} className="card p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
