import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/admin/login',
    },
  }
)

// Protect all /admin routes (except login) and all /api/admin routes
export const config = {
  matcher: ['/admin/((?!login).*)', '/api/admin/(.*)'],
}
