'use client'
import { useState, useEffect } from 'react'
import { getBaseUrl } from '@/lib/utils'

export default function SettingsPage() {
  const [form, setForm] = useState({ username: '', timezone: 'America/New_York' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((data) => {
        setForm({ username: data.username || '', timezone: data.timezone || 'America/New_York' })
        setLoading(false)
      })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to save')
      setSaving(false)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="label">Username</label>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-1">calenderize.app/</span>
            <input
              className="input flex-1"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
              pattern="[a-z0-9_-]+"
              minLength={3}
              maxLength={30}
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Only lowercase letters, numbers, hyphens, underscores. Min 3 chars.</p>
        </div>

        <div>
          <label className="label">Timezone</label>
          <select
            className="input"
            value={form.timezone}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
          >
            {[
              'America/New_York',
              'America/Chicago',
              'America/Denver',
              'America/Los_Angeles',
              'America/Phoenix',
              'America/Anchorage',
              'Pacific/Honolulu',
              'Europe/London',
              'Europe/Paris',
              'Europe/Berlin',
              'Asia/Tokyo',
              'Asia/Shanghai',
              'Asia/Kolkata',
              'Australia/Sydney',
            ].map((tz) => (
              <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">✓ Saved!</span>}
        </div>
      </form>
    </div>
  )
}
