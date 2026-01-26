'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/ui/theme-provider'
import { Button } from '@/components/ui/button'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors"
      >
        <Sun className={`h-[1.2rem] w-[1.2rem] transition-all ${theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
        <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  )
}
