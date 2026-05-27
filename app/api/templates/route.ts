import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome, assunto, html } = await req.json()
  if (!nome || !assunto || !html) return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })

  const template = await prisma.template.create({ data: { nome, assunto, html } })
  return NextResponse.json(template, { status: 201 })
}
