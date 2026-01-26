import { prisma } from '@/lib/prisma'

export async function generateVerificationToken(email: string) {
  const token = Math.random().toString(36).substring(7)
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24)
  
  await prisma.verificationToken.deleteMany({ where: { identifier: email } })
  
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })
  
  return token
}

export async function generatePasswordResetToken(email: string) {
  const token = Math.random().toString(36).substring(7)
  const expires = new Date(Date.now() + 1000 * 60 * 60)
  
  await prisma.verificationToken.deleteMany({ where: { identifier: email } })
  
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })
  
  return token
}

export async function getVerificationTokenByToken(token: string) {
  return prisma.verificationToken.findUnique({ where: { token } })
}

export async function getVerificationTokenByEmail(email: string) {
  return prisma.verificationToken.findFirst({ where: { identifier: email } })
}
