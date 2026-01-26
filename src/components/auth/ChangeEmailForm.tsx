'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { changeEmail } from '@/actions/settings-actions'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const changeEmailSchema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(6),
})

type ChangeEmailValues = z.infer<typeof changeEmailSchema>

interface ChangeEmailFormProps {
  userId: string
}

export function ChangeEmailForm({ userId }: ChangeEmailFormProps) {
  const { toast } = useToast()
  const form = useForm<ChangeEmailValues>({
    resolver: zodResolver(changeEmailSchema),
  })

  async function onSubmit(data: ChangeEmailValues) {
    const formData = new FormData()
    formData.append('newEmail', data.newEmail)
    formData.append('password', data.password)

    const result = await changeEmail(formData, userId)

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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="newEmail" className="text-zinc-300 light:text-zinc-700">New Email</Label>
        <Input
          id="newEmail"
          type="email"
          placeholder="your@email.com"
          {...form.register('newEmail')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-zinc-300 light:text-zinc-700">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...form.register('password')}
        />
      </div>
      <Button type="submit" className="w-full h-11">
        Change Email
      </Button>
    </form>
  )
}
