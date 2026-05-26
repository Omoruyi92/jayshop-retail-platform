'use client'
import * as RadixDialog from '@radix-ui/react-dialog'

export const Dialog        = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger
export const DialogClose   = RadixDialog.Close

export function DialogContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <RadixDialog.Content
        className={`fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ${className}`}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-5 flex items-start justify-between gap-4">{children}</div>
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <RadixDialog.Title className="font-display text-base font-bold uppercase text-jays-navy">
      {children}
    </RadixDialog.Title>
  )
}
