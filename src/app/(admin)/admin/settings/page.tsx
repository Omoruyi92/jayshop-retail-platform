'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import AdminBackButton from '@/components/admin/AdminBackButton'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

const SPECIAL = '@$!%*?&'

function getStrength(pwd: string): { level: 'weak' | 'medium' | 'strong'; score: number } {
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (new RegExp(`[${SPECIAL.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(pwd)) score++
  if (score <= 2) return { level: 'weak', score }
  if (score <= 4) return { level: 'medium', score }
  return { level: 'strong', score }
}

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return 'At least 8 characters required'
  if (!/[A-Z]/.test(pwd)) return 'At least one uppercase letter required'
  if (!/[a-z]/.test(pwd)) return 'At least one lowercase letter required'
  if (!/\d/.test(pwd)) return 'At least one number required'
  if (!new RegExp(`[${SPECIAL.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(pwd))
    return `At least one special character required (${SPECIAL})`
  return null
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string | null
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground ${
            error ? 'border-red-400' : 'border-border'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default function AdminSettingsPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const strength = next ? getStrength(next) : null
  const newPwdError = next ? validatePassword(next) : null
  const confirmError = confirm && next !== confirm ? 'Passwords do not match' : null

  const canSubmit =
    current.length > 0 &&
    next.length > 0 &&
    !newPwdError &&
    !confirmError &&
    !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setServerError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setCurrent('')
        setNext('')
        setConfirm('')
        toast.success('Password updated successfully')
      } else {
        setServerError(data.error || 'Something went wrong')
      }
    } catch {
      setServerError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const strengthColors: Record<'weak' | 'medium' | 'strong', string> = {
    weak: 'bg-red-400',
    medium: 'bg-yellow-400',
    strong: 'bg-green-500',
  }
  const strengthLabels: Record<'weak' | 'medium' | 'strong', string> = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  }

  return (
    <div className="max-w-lg">
      <AdminBackButton />
      <div className="page-header">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Settings</h1>
          <p className="text-jays-steel text-sm mt-1">Manage your staff account credentials</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck size={18} className="text-jays-navy" />
          <h2 className="font-display font-semibold uppercase text-jays-navy text-sm tracking-wide">
            Change Password
          </h2>
        </div>

        {success && (
          <div className="mb-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Password updated. Sign in again on other devices when your current session expires.
          </div>
        )}

        {serverError && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordInput
            label="Current Password"
            value={current}
            onChange={(v) => { setCurrent(v); setServerError(null) }}
            placeholder="Enter your current password"
          />

          <div className="space-y-2">
            <PasswordInput
              label="New Password"
              value={next}
              onChange={(v) => { setNext(v); setServerError(null) }}
              placeholder="Min 8 chars, upper, lower, number, special"
              error={next ? newPwdError : null}
            />

            {/* Strength meter */}
            {next && strength && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {(['weak', 'medium', 'strong'] as const).map((lvl, i) => (
                    <div
                      key={lvl}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        strength.score > i * 2
                          ? strengthColors[strength.level]
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  strength.level === 'weak'
                    ? 'text-red-500'
                    : strength.level === 'medium'
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {strengthLabels[strength.level]} password
                </p>
              </div>
            )}

            {/* Requirements checklist */}
            {next && (
              <ul className="text-xs text-gray-500 space-y-0.5 mt-1">
                {[
                  { label: '8+ characters', ok: next.length >= 8 },
                  { label: 'Uppercase letter', ok: /[A-Z]/.test(next) },
                  { label: 'Lowercase letter', ok: /[a-z]/.test(next) },
                  { label: 'Number', ok: /\d/.test(next) },
                  {
                    label: `Special character (${SPECIAL})`,
                    ok: new RegExp(`[${SPECIAL.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(next),
                  },
                ].map(({ label, ok }) => (
                  <li key={label} className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{ok ? '✓' : '○'}</span>
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <PasswordInput
            label="Confirm New Password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Re-enter new password"
            error={confirmError}
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-jays-navy text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-jays-royal disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-jays-ice rounded-2xl border border-border p-5">
        <h2 className="font-display font-semibold uppercase text-jays-navy text-sm mb-3">Security Notes</h2>
        <ul className="space-y-2 text-sm text-jays-steel">
          <li className="flex items-start gap-2">
            <span className="mt-1 w-2 h-2 shrink-0 rounded-full bg-jays-navy/40"></span>
            Sessions are valid for up to 8 hours. After a password change, active sessions remain valid until they expire or you sign out.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-2 h-2 shrink-0 rounded-full bg-jays-navy/40"></span>
            Use a strong, unique password. Avoid reusing passwords from other services.
          </li>
        </ul>
      </div>
    </div>
  )
}
