import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'

export async function generateTwoFactorSecret(userId: string) {
  const secret = authenticator.generateSecret()
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  })
  return secret
}

export async function generateTwoFactorQRCode(email: string, secret: string) {
  const otpauthUrl = authenticator.keyuri(email, 'MagicTools', secret)
  return QRCode.toDataURL(otpauthUrl)
}

export function verifyTwoFactorToken(token: string, secret: string) {
  return authenticator.check(token, secret)
}
