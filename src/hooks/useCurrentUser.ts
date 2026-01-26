'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export function useCurrentUser() {
  const { data: session } = useSession()
  return session?.user
}
