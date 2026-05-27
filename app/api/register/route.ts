import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { email, password, name, secret } = await req.json()

  if (secret !== process.env.REGISTER_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { email, passwordHash, name } })

  return NextResponse.json({ id: user.id })
}
