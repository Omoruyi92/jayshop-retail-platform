'use client'

import { useState, useRef, useEffect } from 'react'
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
  const role = (session?.user?.role as string) ?? 'Admin'
  const isOwner = role === 'OWNER'

  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    <div ref={containerRef} className="relative flex flex-col items-end">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-full bg-white border border-jays-navy/10 pl-1 pr-3 py-1 hover:bg-gray-50 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-jays-royal/10 text-jays-royal">
          <User size={16} />
        </span>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-semibold text-jays-navy truncate max-w-[160px]" title={email ?? ''}>
            {email ?? 'Admin'}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-jays-royal leading-tight">
            {role}
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-jays-navy/10 bg-white shadow-lg p-2 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold text-jays-navy truncate" title={email ?? ''}>{email ?? 'Admin'}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-jays-royal">{role}</p>
          </div>

          {!isOwner && (
            <button
              type="button"
              onClick={() => { setShowPassword(true); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-jays-navy hover:bg-jays-ice rounded-lg transition-colors"
            >
              <Lock size={14} />
              Change Password
            </button>
          )}

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      )}

      {showPassword && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-jays-navy/10 bg-white p-4 shadow-lg z-50">
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-jays-navy">Change Password</p>
              <button
                type="button"
                onClick={() => setShowPassword(false)}
                className="text-jays-steel hover:text-jays-navy"
              >
                <X size={14} />
              </button>
            </div>
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
          </form>
        </div>
      )}
    </div>
  )
}
