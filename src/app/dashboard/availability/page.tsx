'use client'
import { useState, useEffect } from 'react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const label = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${m} ${h < 12 ? 'AM' : 'PM'}`
  return { value: `${String(h).padStart(2, '0')}:${m}`, label }
})

interface AvailabilityRule {
  dayOfWeek: number
  startTime: string
  endTime: string
  enabled: boolean
}

export default function AvailabilityPage() {
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/user/availability')
      .then((r) => r.json())
      .then((data: AvailabilityRule[]) => {
        // Ensure all 7 days present
        const map = new Map(data.map((d) => [d.dayOfWeek, d]))
        const full = DAYS.map((_, i) => map.get(i) || {
          dayOfWeek: i,
          startTime: '09:00',
          endTime: '17:00',
          enabled: i >= 1 && i <= 5,
        })
        setRules(full)
        setLoading(false)
      })
  }, [])

  const update = (day: number, changes: Partial<AvailabilityRule>) => {
    setRules((r) => r.map((rule) => rule.dayOfWeek === day ? { ...rule, ...changes } : rule))
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/user/availability', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
        <p className="text-gray-500 mt-1">Set the days and hours when you are available for bookings</p>
      </div>

      <div className="card divide-y divide-gray-100">
        {rules.map((rule) => (
          <div key={rule.dayOfWeek} className="flex items-center gap-4 p-4">
            <label className="flex items-center gap-3 w-36">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(e) => update(rule.dayOfWeek, { enabled: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600"
              />
              <span className={`text-sm font-medium ${rule.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                {DAYS[rule.dayOfWeek].slice(0, 3)}
              </span>
            </label>

            {rule.enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <select
                  value={rule.startTime}
                  onChange={(e) => update(rule.dayOfWeek, { startTime: e.target.value })}
                  className="input w-auto text-sm"
                >
                  {TIMES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <span className="text-gray-400 text-sm">to</span>
                <select
                  value={rule.endTime}
                  onChange={(e) => update(rule.dayOfWeek, { endTime: e.target.value })}
                  className="input w-auto text-sm"
                >
                  {TIMES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Unavailable</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Saved!</span>}
      </div>
    </div>
  )
}
