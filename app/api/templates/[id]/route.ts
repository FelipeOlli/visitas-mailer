import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const template = await prisma.template.findUnique({ where: { id: params.id } })
  if (!template) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(template)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome, assunto, html } = await req.json()
  const template = await prisma.template.update({
    where: { id: params.id },
    data: { nome, assunto, html },
  })
  return NextResponse.json(template)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.template.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
