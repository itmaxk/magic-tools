'use client'

import { logout } from '@/actions/auth-actions'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <Button variant="outline" onClick={logout}>
      Logout
    </Button>
  )
}
