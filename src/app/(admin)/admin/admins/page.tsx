'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Shield, Users, KeyRound, Eye, EyeOff } from 'lucide-react'
import AdminBackButton from '@/components/admin/AdminBackButton'
import { can } from '@/lib/auth/authorize'

type Admin = {
  id: string
  email: string
  role: string
  createdAt: string
}

const ROLES = ['OWNER', 'MANAGER', 'STAFF', 'VIEWER']

function TogglePasswordInput({
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className={`relative ${className}`}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
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
  )
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('STAFF')
  const [saving, setSaving] = useState(false)
  const [resetAdminId, setResetAdminId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(s => setCurrentRole(s?.user?.role ?? null))
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/admins')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAdmins(data.rows)
    } catch {
      toast.error('Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Admin created')
        setFormOpen(false)
        setNewEmail('')
        setNewPassword('')
        setNewRole('STAFF')
        load()
      } else {
        toast.error(data.error || 'Failed to create admin')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function updateRole(id: string, role: string) {
    const res = await fetch(`/api/admin/admins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Role updated')
      load()
    } else {
      toast.error(data.error || 'Failed')
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this admin?')) return
    const res = await fetch(`/api/admin/admins/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      toast.success('Admin deleted')
      load()
    } else {
      toast.error(data.error || 'Failed')
    }
  }

  async function resetPasswordFor(id: string) {
    if (!resetPassword || resetPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    const res = await fetch(`/api/admin/admins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Password reset successfully')
      setResetAdminId(null)
      setResetPassword('')
    } else {
      toast.error(data.error || 'Failed to reset password')
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <AdminBackButton />
          <h1 className="text-2xl font-bold flex items-center gap-2 mt-2">
            <Shield size={24} className="text-jays-red" />
            Admins
          </h1>
          <p className="text-gray-500 text-sm">Manage staff access and roles</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-jays-red text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          disabled={!currentRole || !can(currentRole, 'admin:manage')}
        >
          <Plus size={16} /> Add Admin
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 max-w-xl">
          <h2 className="font-semibold flex items-center gap-2"><Users size={18}/> New Admin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="email" placeholder="Email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="border rounded-lg px-3 py-2" />
            <TogglePasswordInput
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Password"
              required
            />
          </div>
          <select value={newRole} onChange={e => setNewRole(e.target.value)} className="border rounded-lg px-3 py-2">
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-jays-red text-white rounded-lg">{saving ? 'Creating...' : 'Create'}</button>
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3 font-mono">{admin.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={admin.role}
                    onChange={e => updateRole(admin.id, e.target.value)}
                    className="border rounded px-2 py-1 text-xs"
                    disabled={!currentRole || !can(currentRole, 'admin:manage')}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(admin.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {resetAdminId === admin.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <TogglePasswordInput
                        value={resetPassword}
                        onChange={setResetPassword}
                        placeholder="New password"
                        className="w-36"
                      />
                      <button
                        onClick={() => resetPasswordFor(admin.id)}
                        className="text-jays-royal hover:text-jays-navy p-1"
                        disabled={!currentRole || !can(currentRole, 'admin:manage')}
                      >
                        <KeyRound size={16} />
                      </button>
                      <button
                        onClick={() => { setResetAdminId(null); setResetPassword('') }}
                        className="text-gray-500 hover:text-gray-700 p-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setResetAdminId(admin.id)}
                        className="text-jays-royal hover:text-jays-navy p-1"
                        disabled={!currentRole || !can(currentRole, 'admin:manage')}
                        title="Reset password"
                      >
                        <KeyRound size={16} />
                      </button>
                      <button
                        onClick={() => remove(admin.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        disabled={!currentRole || !can(currentRole, 'admin:manage')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
