'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChangeEmailForm } from '@/components/auth/ChangeEmailForm'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Mail, Lock, Shield } from 'lucide-react'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session?.user?.id) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white light:text-zinc-900 mb-2">Settings</h1>
        <p className="text-zinc-400 light:text-zinc-600">Manage your account settings and preferences</p>
      </div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-900/50 light:bg-zinc-100/80 light:border light:border-zinc-200">
              <TabsTrigger 
                value="email" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 light:data-[state=active]:bg-purple-600 light:data-[state=active]:text-white light:data-[state=active]:shadow-lg light:data-[state=active]:shadow-purple-500/20"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger 
                value="password" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 light:data-[state=active]:bg-purple-600 light:data-[state=active]:text-white light:data-[state=active]:shadow-lg light:data-[state=active]:shadow-purple-500/20"
              >
                <Lock className="mr-2 h-4 w-4" />
                Password
              </TabsTrigger>
              <TabsTrigger 
                value="twofactor" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 light:data-[state=active]:bg-purple-600 light:data-[state=active]:text-white light:data-[state=active]:shadow-lg light:data-[state=active]:shadow-purple-500/20"
              >
                <Shield className="mr-2 h-4 w-4" />
                2FA
              </TabsTrigger>
            </TabsList>
            <TabsContent value="email" className="mt-6">
              <div className="bento-card">
                <ChangeEmailForm userId={session.user.id} />
              </div>
            </TabsContent>
            <TabsContent value="password" className="mt-6">
              <div className="bento-card">
                <ChangePasswordForm userId={session.user.id} />
              </div>
            </TabsContent>
            <TabsContent value="twofactor" className="mt-6">
              <div className="bento-card">
                <TwoFactorSetup userId={session.user.id} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
