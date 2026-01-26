import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

function askEmail(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('Enter admin email (or press Enter for admin@magic.tools): ', (email) => {
      rl.close()
      const trimmedEmail = email.trim()
      resolve(trimmedEmail || 'admin@magic.tools')
    })
  })
}

async function main() {
  console.log('=== Magic Tools - Database Seed ===')
  
  const adminEmail = process.env.ADMIN_EMAIL || await askEmail()
  
  if (!adminEmail.includes('@')) {
    console.error('Invalid email address')
    process.exit(1)
  }

  const adminUsername = process.env.ADMIN_USERNAME || 'magic'
  const adminPassword = process.env.ADMIN_PASSWORD || 'magicpass'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  
  console.log(`\nCreating admin user:`)
  console.log(`  Username: ${adminUsername}`)
  console.log(`  Password: ${adminPassword}`)
  console.log(`  Email: ${adminEmail}`)
  console.log(`  Role: ADMIN`)
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Magic Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })
  
  console.log('\nAdmin user created successfully:', { id: admin.id, email: admin.email })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
