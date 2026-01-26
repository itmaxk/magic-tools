'use server'

import { signIn, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { generateVerificationToken, generatePasswordResetToken } from '@/utils/tokens'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
})

export async function login(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const validated = loginSchema.safeParse(data)
  
  if (!validated.success) {
    return { error: 'Invalid credentials' }
  }
  
  try {
    await signIn('credentials', validated.data)
    return { success: true }
  } catch (error) {
    return { error: 'Invalid credentials' }
  }
}

export async function register(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const validated = registerSchema.safeParse(data)
  
  if (!validated.success) {
    return { error: 'Invalid data' }
  }
  
  const { name, email, password } = validated.data
  const existingUser = await prisma.user.findUnique({ where: { email } })
  
  if (existingUser) {
    return { error: 'Email already exists' }
  }
  
  const hashedPassword = await bcrypt.hash(password, 10)
  
  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })
  
  const token = await generateVerificationToken(email)
  await sendVerificationEmail(email, token)
  
  return { success: true, message: 'Check your email for verification link' }
}

export async function logout() {
  await signOut()
}

export async function forgotPassword(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const validated = forgotPasswordSchema.safeParse(data)
  
  if (!validated.success) {
    return { error: 'Invalid email' }
  }
  
  const { email } = validated.data
  const user = await prisma.user.findUnique({ where: { email } })
  
  if (!user) {
    return { error: 'User not found' }
  }
  
  const token = await generatePasswordResetToken(email)
  await sendPasswordResetEmail(email, token)
  
  return { success: true, message: 'Check your email for reset link' }
}

export async function resetPassword(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const validated = resetPasswordSchema.safeParse(data)
  
  if (!validated.success) {
    return { error: 'Invalid data' }
  }
  
  const { token, password } = validated.data
  const verificationToken = await prisma.verificationToken.findUnique({ where: { token } })
  
  if (!verificationToken) {
    return { error: 'Invalid token' }
  }
  
  const hashedPassword = await bcrypt.hash(password, 10)
  
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { password: hashedPassword },
  })
  
  await prisma.verificationToken.delete({ where: { token } })
  
  return { success: true, message: 'Password reset successfully' }
}

export async function verifyEmail(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({ where: { token } })
  
  if (!verificationToken) {
    return { error: 'Invalid token' }
  }
  
  const hasExpired = new Date(verificationToken.expires) < new Date()
  
  if (hasExpired) {
    return { error: 'Token has expired' }
  }
  
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  })
  
  await prisma.verificationToken.delete({ where: { token } })
  
  return { success: true }
}

export async function resendVerificationEmail(email: string) {
  try {
    const token = await generateVerificationToken(email)
    await sendVerificationEmail(email, token)
    return { success: true, message: 'Verification email sent' }
  } catch (error) {
    return { error: 'Failed to send verification email' }
  }
}
