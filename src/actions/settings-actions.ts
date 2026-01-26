'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'
import { generateTwoFactorSecret, generateTwoFactorQRCode, verifyTwoFactorToken } from '@/utils/two-factor'
import { generateVerificationToken } from '@/utils/tokens'
import { sendVerificationEmail } from '@/lib/email'

const changeEmailSchema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(6),
})

const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

const toggleTwoFactorSchema = z.object({
  password: z.string().min(6),
})

const changeRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['USER', 'ADMIN']),
})

export async function changeEmail(formData: FormData, userId: string) {
  const data = Object.fromEntries(formData.entries())
  const validated = changeEmailSchema.safeParse(data)
  
  if (!validated.success) {
    return { error: 'Invalid data' }
  }
  
  const { newEmail, password } = validated.data
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'Invalid password' }
  }
  
  const existingUser = await prisma.user.findUnique({ where: { email: newEmail } })
  
  if (existingUser) {
    return { error: 'Email already exists' }
  }
  
  const token = await generateVerificationToken(newEmail)
  await sendVerificationEmail(newEmail, token)
  
  return { success: true, message: 'Check your email for verification link' }
}

export async function changePassword(formData: FormData, userId: string) {
  const data = Object.fromEntries(formData.entries())
  const validated = changePasswordSchema.safeParse(data)
  
  if (!validated.success) {
    return { error: 'Invalid data' }
  }
  
  const { oldPassword, newPassword } = validated.data
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
    return { error: 'Invalid old password' }
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })
  
  return { success: true, message: 'Password changed successfully' }
}

export async function toggleTwoFactor(formData: FormData, userId: string) {
  const data = Object.fromEntries(formData.entries())
  const validated = toggleTwoFactorSchema.safeParse(data)
  
  if (!validated.success) {
    return { error: 'Invalid data' }
  }
  
  const { password } = validated.data
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: 'Invalid password' }
  }
  
  if (user.isTwoFactorEnabled) {
    await prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false, twoFactorSecret: null },
    })
    return { success: true, message: 'Two-factor authentication disabled' }
  } else {
    const secret = await generateTwoFactorSecret(userId)
    const qrCode = await generateTwoFactorQRCode(user.email!, secret)
    return { success: true, message: 'Two-factor authentication enabled', qrCode, secret }
  }
}

export async function verifyTwoFactor(token: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user || !user.twoFactorSecret) {
    return { error: 'Two-factor not setup' }
  }
  
  const isValid = verifyTwoFactorToken(token, user.twoFactorSecret)
  
  if (!isValid) {
    return { error: 'Invalid token' }
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: { isTwoFactorEnabled: true },
  })
  
  return { success: true, message: 'Two-factor authentication verified' }
}

export async function changeRole(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const validated = changeRoleSchema.safeParse(data)
  
  if (!validated.success) {
    return { error: 'Invalid data' }
  }
  
  const { userId, role } = validated.data
  
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })
  
  return { success: true, message: 'Role changed successfully' }
}
