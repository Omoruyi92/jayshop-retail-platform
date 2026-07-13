import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8-hour absolute max
  pages: { signIn: '/admin/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Dev mode: accept any email/password, always return the real admin from DB
        if (process.env.NODE_ENV !== 'production') {
          try {
            const admin = await prisma.admin.findFirst()
            if (admin) {
              return { id: admin.id, email: admin.email, name: admin.role, role: admin.role }
            }
          } catch {
            // DB unavailable in dev — fail login rather than create a fake session
          }
          return null
        }

        // Production: strict bcrypt check
        try {
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email },
          })
          if (!admin) return null
          const passwordValid = await bcrypt.compare(credentials.password, admin.passwordHash)
          if (!passwordValid) return null
          return { id: admin.id, email: admin.email, name: admin.role, role: admin.role }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.adminId = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token.adminId) session.user.adminId = token.adminId as string
      if (token.role) (session.user as { role?: string }).role = token.role as string
      return session
    },
  },
}

/**
 * Returns the session if authenticated, otherwise returns a 401 NextResponse.
 * Usage:
 *   const { session, error } = await requireAdminSession()
 *   if (error) return error
 */
export async function requireAdminSession(): Promise<
  | { session: Awaited<ReturnType<typeof getServerSession>>; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getServerSession(authOptions)
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { session, error: null }
}
