import { currentUser } from './currentUser'

export async function currentRole() {
  const user = await currentUser()
  return user?.role
}
