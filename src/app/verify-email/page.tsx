'use client'

import { useEffect, useState } from 'react'
import { verifyEmail } from '@/actions/auth-actions'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface VerifyEmailPageProps {
  params: Promise<{ token: string }>
}

export default function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const { toast } = useToast()
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    params.then((resolvedParams) => {
      setToken(resolvedParams.token)
      verifyEmail(resolvedParams.token).then((result) => {
        if (result.error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error,
          })
        } else if (result.success) {
          toast({
            title: 'Success',
            description: 'Email verified successfully',
          })
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        }
      })
    })
  }, [params, toast])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verifying Email</CardTitle>
          <CardDescription>Please wait while we verify your email...</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
