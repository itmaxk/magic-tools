import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      isTwoFactorEnabled: boolean
    } & DefaultSession['user']
  }

  interface User {
    role: string
    isTwoFactorEnabled: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    id: string
    isTwoFactorEnabled: boolean
  }
}
