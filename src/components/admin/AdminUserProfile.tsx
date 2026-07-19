'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { LogOut, User, Lock, Loader2, X, Eye, EyeOff } from 'lucide-react'

function ProfilePasswordInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  )
}

export default function AdminUserProfile() {
  const { data: session, update } = useSession()
  const email = session?.user?.email
  const role = session?.user?.role ?? 'Admin'

  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update password')
      alert('Password updated successfully')
      setShowPassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await update()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center justify-end gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold text-jays-navy truncate max-w-[180px]" title={email ?? ''}>
            {email ?? 'Admin'}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-jays-royal">
            {role}
          </span>
        </div>
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-jays-royal/10 text-jays-royal">
          <User size={16} />
        </span>
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-white hover:bg-gray-50 text-jays-navy border border-jays-navy/10 text-xs font-semibold uppercase tracking-wide px-3 py-2 transition-colors"
        >
          <Lock size={13} />
          <span className="hidden sm:inline">Password</span>
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-1.5 rounded-full bg-jays-royal hover:bg-jays-navy text-white text-xs font-semibold uppercase tracking-wide px-3.5 py-2 transition-colors"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Sign Out</span>
          <span className="sm:hidden">Out</span>
        </button>
      </div>

      {showPassword && (
        <form
          onSubmit={handleChangePassword}
          className="w-full max-w-xs rounded-xl border border-jays-navy/10 bg-white p-4 shadow-sm mt-1"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-jays-navy">Change Password</p>
            <button type="button" onClick={() => setShowPassword(false)} className="text-jays-steel hover:text-jays-navy">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2">
            <ProfilePasswordInput
              label="Current password"
              placeholder="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
            <ProfilePasswordInput
              label="New password"
              placeholder="New password"
              value={newPassword}
              onChange={setNewPassword}
            />
            <ProfilePasswordInput
              label="Confirm new password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-jays-royal hover:bg-jays-navy text-white text-xs font-semibold uppercase tracking-wide px-3 py-2 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
