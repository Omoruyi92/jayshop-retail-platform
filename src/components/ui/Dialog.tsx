'use client'
import { createContext, useContext, useEffect, useRef, useState, cloneElement, isValidElement } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@/hooks/useFocusTrap'

/**
 * Lightweight, dependency-free modal primitives (API-compatible with the
 * Radix Dialog components they replace: Dialog, DialogTrigger, DialogClose,
 * DialogContent, DialogHeader, DialogTitle).
 *
 * Radix's `@radix-ui/react-dialog` + `@radix-ui/react-presence` combo has a
 * known infinite-render bug on this React 18 build ("Maximum update depth
 * exceeded" inside presence.tsx's setNode ref callback), so this file
 * implements the same surface area without Radix.
 */

type DialogCtxValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogCtxValue | null>(null)

function useDialogCtx(name: string) {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error(`${name} must be used within <Dialog>`)
  return ctx
}

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { setOpen } = useDialogCtx('DialogTrigger')
  const onClick = () => setOpen(true)
  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: (e: React.MouseEvent) => {
        const props = children.props as { onClick?: (e: React.MouseEvent) => void }
        props.onClick?.(e)
        onClick()
      },
    })
  }
  return <button type="button" onClick={onClick}>{children}</button>
}

export function DialogClose({
  children,
  asChild,
  className = '',
}: {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}) {
  const { setOpen } = useDialogCtx('DialogClose')
  const onClick = () => setOpen(false)
  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: (e: React.MouseEvent) => {
        const props = children.props as { onClick?: (e: React.MouseEvent) => void }
        props.onClick?.(e)
        onClick()
      },
    })
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  )
}

export function DialogContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen } = useDialogCtx('DialogContent')
  const [mounted, setMounted] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => setMounted(true), [])
  useFocusTrap(open, contentRef, () => setOpen(false))
  if (!mounted || !open) return null
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl focus:outline-none ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-5 flex items-start justify-between gap-4">{children}</div>
}

export function DialogTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`font-display text-base font-bold uppercase text-jays-navy ${className}`}>
      {children}
    </h3>
  )
}
