'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toggleTwoFactor, verifyTwoFactor } from '@/actions/settings-actions'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const toggleTwoFactorSchema = z.object({
  password: z.string().min(6),
})

type ToggleTwoFactorValues = z.infer<typeof toggleTwoFactorSchema>

interface TwoFactorSetupProps {
  userId: string
}

export function TwoFactorSetup({ userId }: TwoFactorSetupProps) {
  const { toast } = useToast()
  const [isEnabled, setIsEnabled] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [showVerify, setShowVerify] = useState(false)
  
  const form = useForm<ToggleTwoFactorValues>({
    resolver: zodResolver(toggleTwoFactorSchema),
  })

  async function onSubmit(data: ToggleTwoFactorValues) {
    const formData = new FormData()
    formData.append('password', data.password)

    const result = await toggleTwoFactor(formData, userId)

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      })
    } else if (result.success) {
      if (result.qrCode) {
        setQrCode(result.qrCode)
        setSecret(result.secret!)
        setShowVerify(true)
      } else {
        setIsEnabled(false)
        setQrCode(null)
        setSecret(null)
        setShowVerify(false)
      }
      toast({
        title: 'Success',
        description: result.message,
      })
      form.reset()
    }
  }

  async function handleVerify(token: string) {
    const result = await verifyTwoFactor(token, userId)

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      })
    } else if (result.success) {
      setIsEnabled(true)
      setShowVerify(false)
      toast({
        title: 'Success',
        description: result.message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Current status</p>
          <p className={`text-lg font-semibold ${isEnabled ? 'text-green-400' : 'text-zinc-400'}`}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
        {isEnabled && (
          <div className="flex items-center gap-2 text-green-400">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm">Active</span>
          </div>
        )}
      </div>
      
      {!isEnabled && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
            />
          </div>
          <Button type="submit" className="w-full h-11">
            Enable Two-Factor Auth
          </Button>
        </form>
      )}

      {showVerify && qrCode && secret && (
        <div className="space-y-6">
          <div className="bento-card">
            <Label className="text-zinc-300">Scan QR Code</Label>
            <div className="mt-3 flex justify-center">
              <img src={qrCode} alt="QR Code" className="rounded-lg" />
            </div>
          </div>
          <div className="bento-card">
            <Label className="text-zinc-300">Or enter manually</Label>
            <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <p className="font-mono text-sm text-purple-400 text-center">{secret}</p>
            </div>
          </div>
          <TwoFactorVerifyForm onVerify={handleVerify} />
        </div>
      )}

      {isEnabled && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
            />
          </div>
          <Button type="submit" variant="destructive" className="w-full h-11">
            Disable Two-Factor Auth
          </Button>
        </form>
      )}
    </div>
  )
}

interface TwoFactorVerifyFormProps {
  onVerify: (token: string) => void
}

function TwoFactorVerifyForm({ onVerify }: TwoFactorVerifyFormProps) {
  const [token, setToken] = useState('')

  return (
    <div className="space-y-3">
      <Label htmlFor="token" className="text-zinc-300">Verification Code</Label>
      <Input
        id="token"
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Enter 6-digit code"
        maxLength={6}
      />
      <Button onClick={() => onVerify(token)} className="w-full h-11">
        Verify Code
      </Button>
    </div>
  )
}
