'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { forgotPassword } from '@/actions/auth-actions'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const { toast } = useToast()
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordValues) {
    const formData = new FormData()
    formData.append('email', data.email)

    const result = await forgotPassword(formData)

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
          <Button type="submit" className="w-full h-11 text-base">
            Send Reset Link
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-zinc-400 light:text-zinc-600">
          Remember your password?{' '}
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
