'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { register } from '@/actions/auth-actions'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { toast } = useToast()
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterValues) {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('email', data.email)
    formData.append('password', data.password)

    const result = await register(formData)

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      })
    } else if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      })
      form.reset()
    }
  }

  return (
    <Card className="w-full glass-card border-zinc-800/50 light:border-zinc-200/50">
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-300 light:text-zinc-700">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-400 light:text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300 light:text-zinc-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-400 light:text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300 light:text-zinc-700">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-400 light:text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full h-11 text-base">
            Create Account
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-zinc-400 light:text-zinc-600">
          Already have an account?{' '}
          <a 
            href="/login" 
            className="text-purple-400 hover:text-purple-300 light:hover:text-purple-600 transition-colors"
          >
            Sign in
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
