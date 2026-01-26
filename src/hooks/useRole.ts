'use client'

import { useCurrentUser } from './useCurrentUser'

export function useCurrentRole() {
  const user = useCurrentUser()
  return user?.role
}

export function useRole() {
  return useCurrentRole()
}
