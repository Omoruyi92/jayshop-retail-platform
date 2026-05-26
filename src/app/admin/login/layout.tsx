import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Staff Login | Jays Shop',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
