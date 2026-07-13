'use client'
import { useState } from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/Dialog'
import { COLOR_LIBRARY } from '@/lib/constants'
import { Check, X, Palette } from 'lucide-react'

export default function ColorPickerModal({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (colors: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(selected)
  const [customName, setCustomName] = useState('')

  function toggleColor(name: string) {
    setDraft((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]))
  }

  function addCustom() {
    const name = customName.trim()
    if (!name) return
    if (!draft.includes(name)) setDraft((prev) => [...prev, name])
    setCustomName('')
  }

  function save() {
    onChange(draft)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(selected)
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-jays-navy hover:bg-jays-ice transition-colors"
        >
          <Palette size={14} />
          Choose Colors
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Product Colors</DialogTitle>
          <DialogClose asChild>
            <button className="text-jays-steel hover:text-jays-navy" aria-label="Close">
              <X size={18} />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
          {COLOR_LIBRARY.map((c) => {
            const isSelected = draft.includes(c.name)
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => toggleColor(c.name)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-colors ${
                  isSelected ? 'border-jays-navy bg-jays-ice/60' : 'border-border hover:bg-jays-ice/30'
                }`}
              >
                <span
                  className="relative w-8 h-8 rounded-full border border-black/10 shadow-sm"
                  style={{ background: c.hex }}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check size={14} className={c.name === 'White' || c.name === 'Cream' ? 'text-jays-navy' : 'text-white'} />
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium text-jays-navy text-center leading-tight">{c.name}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-jays-steel mb-1.5">Add a custom color</p>
          <div className="flex gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
              placeholder="e.g. Cardinal Red, #A6192E"
              className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />
            <button
              type="button"
              onClick={addCustom}
              className="text-xs font-semibold text-jays-navy hover:text-jays-royal px-3 rounded-lg border border-border"
            >
              Add
            </button>
          </div>
        </div>

        {draft.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {draft.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full bg-jays-ice px-2.5 py-1 text-xs font-medium text-jays-navy"
              >
                {name}
                <button type="button" onClick={() => setDraft((prev) => prev.filter((c) => c !== name))}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <DialogClose asChild>
            <button type="button" className="px-4 py-2 rounded-xl text-sm font-semibold text-jays-steel hover:bg-jays-ice transition-colors">
              Cancel
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={save}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-jays-red text-white hover:bg-red-600 transition-colors"
          >
            Save Colors
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
