'use client'

import { useRole } from '@/hooks/useRole'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldAlert } from 'lucide-react'

interface RoleGateProps {
  children: React.ReactNode
  allowedRole?: string
}

export function RoleGate({ children, allowedRole = 'ADMIN' }: RoleGateProps) {
  const role = useRole()

  if (role !== allowedRole) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access this content.
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}
