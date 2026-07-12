'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeft } from 'lucide-react'

/**
 * Slim utility bar rendered below the main header (outside the primary nav)
 * that gives users quick access to:
 *  - Home: jump straight back to the storefront homepage
 *  - Back: return to the previous page (browser history)
 *
 * Hidden on the homepage itself since there's nothing to navigate "back" from.
 */
export default function PageNavControls() {
  const pathname = usePathname()

  if (pathname === '/') return null

  // Use the browser's native history back instead of next/navigation's
  // router.back() to avoid any App Router scroll-restoration / re-render
  // side effects — this keeps the current viewport and scroll position
  // completely untouched.
  const handleBack = () => {
    if (typeof window !== 'undefined') window.history.back()
  }

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          title="Go back"
          className="flex items-center justify-center gap-1 h-7 px-2 rounded-md text-jays-steel hover:text-jays-navy hover:bg-jays-ice transition-colors duration-150"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          <span className="text-xs font-medium hidden sm:inline">Back</span>
        </button>

        <span className="w-px h-4 bg-gray-200" aria-hidden="true" />

        <Link
          href="/"
          aria-label="Go to home"
          title="Home"
          className="flex items-center justify-center w-7 h-7 rounded-md text-jays-steel hover:text-jays-navy hover:bg-jays-ice transition-colors duration-150"
        >
          <Home size={16} strokeWidth={2} />
        </Link>
      </div>
    </div>
  )
}
