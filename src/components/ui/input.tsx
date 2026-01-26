import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-zinc-800 dark:border-zinc-800 bg-zinc-900/50 dark:bg-zinc-900/50 px-3 py-2 text-base text-white dark:text-white shadow-sm transition-colors backdrop-blur-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-purple-500/50 focus-visible:ring-1 focus-visible:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm input-element',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
