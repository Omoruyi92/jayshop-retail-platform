'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AdminBackButton from '@/components/admin/AdminBackButton'
import { SlidersHorizontal, CalendarClock } from 'lucide-react'

interface HoldSettings {
  id: string
  enable48HourHold: boolean
  standardHoldHours: number
  extendedHoldHours: number
  updatedAt: string
}

export default function HoldSettingsPage() {
  const [settings, setSettings] = useState<HoldSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Local editable state
  const [enable48HourHold, setEnable48HourHold] = useState(true)
  const [standardHoldHours, setStandardHoldHours] = useState(3)
  const [extendedHoldHours, setExtendedHoldHours] = useState(48)

  useEffect(() => {
    fetch('/api/admin/hold-settings')
      .then((res) => res.json())
      .then((data: { settings: HoldSettings }) => {
        setSettings(data.settings)
        setEnable48HourHold(data.settings.enable48HourHold)
        setStandardHoldHours(data.settings.standardHoldHours)
        setExtendedHoldHours(data.settings.extendedHoldHours)
      })
      .catch(() => toast.error('Failed to load hold settings'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/hold-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable48HourHold, standardHoldHours, extendedHoldHours }),
      })
      const data = await res.json()
      if (res.ok) {
        setSettings(data.settings)
        toast.success('Hold settings saved')
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg">
        <AdminBackButton />
        <p className="text-jays-steel text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <AdminBackButton />
      <div className="page-header">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Hold Settings</h1>
          <p className="text-jays-steel text-sm mt-1">Configure system-wide hold duration rules</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal size={18} className="text-jays-navy" />
          <h2 className="font-display font-semibold uppercase text-jays-navy text-sm tracking-wide">
            Hold Duration
          </h2>
        </div>

        {/* Enable toggle */}
        <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer hover:border-jays-navy/40 transition-colors">
          <input
            type="checkbox"
            checked={enable48HourHold}
            onChange={(e) => setEnable48HourHold(e.target.checked)}
            className="mt-1 w-4 h-4 accent-jays-navy"
          />
          <div>
            <p className="text-sm font-semibold text-jays-navy">Enable 48 Hour Hold</p>
            <p className="text-xs text-jays-steel mt-0.5">
              When enabled, customers picking up at Gate 5 (Section 110) or the stadium
              queue can receive the extended hold duration below — unless it&apos;s a game day,
              in which case the standard (shorter) duration always applies.
            </p>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Standard Hold Hours
            </label>
            <input
              type="number"
              min={1}
              value={standardHoldHours}
              onChange={(e) => setStandardHoldHours(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />
            <p className="text-xs text-jays-steel mt-1">
              Fallback duration used on game days or when the 48-hour toggle is off.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extended Hold Hours
            </label>
            <input
              type="number"
              min={1}
              value={extendedHoldHours}
              onChange={(e) => setExtendedHoldHours(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />
            <p className="text-xs text-jays-steel mt-1">
              Used when the toggle above is enabled and today is not a game day.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-jays-ice rounded-xl px-4 py-3 text-xs text-jays-steel">
          <CalendarClock size={14} className="mt-0.5 shrink-0 text-jays-navy" />
          <p>
            <span className="font-semibold text-jays-navy">Game-day override:</span> on any date
            registered in <span className="font-medium">Game Days</span>, the extended hold
            duration is automatically disabled and every new hold uses the standard hours
            above, regardless of this toggle.
          </p>
        </div>

        <div className="pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-jays-navy text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-jays-royal disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      {settings && (
        <p className="text-xs text-jays-steel mt-3">
          Last updated: {new Date(settings.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
