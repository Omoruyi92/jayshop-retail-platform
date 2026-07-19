import 'next-auth'
import { AdminRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      adminId?: string
      role?: AdminRole | string
    }
  }

  interface User {
    adminId?: string
    role?: AdminRole | string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    adminId?: string
    role?: AdminRole | string
  }
}
