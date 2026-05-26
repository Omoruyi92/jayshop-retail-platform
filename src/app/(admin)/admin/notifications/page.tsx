'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import AdminBackButton from '@/components/admin/AdminBackButton'

interface SlackSettings {
  id?: string
  webhookUrl: string
  channelName: string
  interactiveEnabled: boolean
}

export default function AdminNotificationsPage() {
  const [settings, setSettings] = useState<SlackSettings>({ webhookUrl: '', channelName: '', interactiveEnabled: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/slack-settings')
      .then((r) => r.json())
      .then((d) => { if (d.settings) setSettings(d.settings) })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/slack-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    if (res.ok) toast.success('Slack settings saved')
    else toast.error('Failed to save')
  }

  async function handleTest() {
    setTesting(true)
    const res = await fetch('/api/admin/slack-settings/test', { method: 'POST' })
    setTesting(false)
    if (res.ok) toast.success('Test message sent to Slack!')
    else toast.error('Test failed — check webhook URL')
  }

  if (loading) return <div className="text-jays-steel p-8">Loading…</div>

  return (
    <div className="max-w-2xl">
      <AdminBackButton />
      <div className="page-header">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Notifications</h1>
          <p className="text-jays-steel text-sm mt-1">Configure Slack notifications for hold events</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slack Webhook URL *</label>
          <input
            type="url"
            required
            value={settings.webhookUrl}
            onChange={(e) => setSettings(s => ({ ...s, webhookUrl: e.target.value }))}
            placeholder="https://hooks.slack.com/services/…"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground"
          />
          <p className="text-xs text-jays-steel mt-1">
            Create at: api.slack.com/messaging/webhooks
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel Name</label>
          <input
            value={settings.channelName}
            onChange={(e) => setSettings(s => ({ ...s, channelName: e.target.value }))}
            placeholder="#jays-shop-holds"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="interactive"
            type="checkbox"
            checked={settings.interactiveEnabled}
            onChange={(e) => setSettings(s => ({ ...s, interactiveEnabled: e.target.checked }))}
            className="w-4 h-4 accent-jays-navy"
          />
          <label htmlFor="interactive" className="text-sm text-gray-700">
            Enable interactive buttons (Mark Picked Up / Release) in Slack messages
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-jays-navy text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-jays-royal disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {settings.webhookUrl && (
            <button type="button" onClick={handleTest} disabled={testing}
              className="border border-jays-navy text-jays-navy px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-jays-navy hover:text-white disabled:opacity-50 transition-colors">
              {testing ? 'Sending…' : 'Send Test Ping'}
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 bg-jays-ice rounded-2xl border border-border p-5">
        <h2 className="font-display font-semibold uppercase text-jays-navy text-sm mb-3">What Triggers Notifications</h2>
        <ul className="space-y-2 text-sm text-jays-steel">
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> New hold placed → Slack Block Kit message with product, customer, code, expiry</li>
          <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400"></span> Hold expired (48h) → Slack alert, staff only (no customer notification)</li>
          {settings.interactiveEnabled && <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Interactive buttons enabled → Mark Picked Up / Release direct from Slack</li>}
        </ul>
      </div>
    </div>
  )
}
