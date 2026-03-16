'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { slugify } from '@/lib/utils'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#14b8a6']
const DURATIONS = [15, 30, 45, 60, 90, 120]

export default function NewEventTypePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration: 30,
    color: '#3b82f6',
    slug: '',
  })

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: f.slug || slugify(title) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/user/event-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error?.formErrors?.[0] || data.error || 'Something went wrong')
      setLoading(false)
      return
    }
    router.push('/dashboard/event-types')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/event-types" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Event Types
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Event Type</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="label">Title</label>
          <input
            className="input"
            placeholder="30 Minute Meeting"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">URL Slug</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">yourname/</span>
            <input
              className="input flex-1"
              placeholder="30min"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Description (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="A quick sync to discuss..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Duration</label>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm((f) => ({ ...f, duration: d }))}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.duration === d
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Create Event Type'}
          </button>
          <Link href="/dashboard/event-types" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
