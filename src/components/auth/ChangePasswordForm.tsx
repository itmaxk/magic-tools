'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { changePassword } from '@/actions/settings-actions'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

interface ChangePasswordFormProps {
  userId: string
}

export function ChangePasswordForm({ userId }: ChangePasswordFormProps) {
  const { toast } = useToast()
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  async function onSubmit(data: ChangePasswordValues) {
    const formData = new FormData()
    formData.append('oldPassword', data.oldPassword)
    formData.append('newPassword', data.newPassword)

    const result = await changePassword(formData, userId)

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
        <Label htmlFor="oldPassword" className="text-zinc-300 light:text-zinc-700">Old Password</Label>
        <Input
          id="oldPassword"
          type="password"
          placeholder="••••••••"
          {...form.register('oldPassword')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-zinc-300 light:text-zinc-700">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="••••••••"
          {...form.register('newPassword')}
        />
      </div>
      <Button type="submit" className="w-full h-11">
        Change Password
      </Button>
    </form>
  )
}
