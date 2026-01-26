'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/ui/theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark" storageKey="magic-tools-theme">
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
