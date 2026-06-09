import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome } = await req.json()
  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
  }

  try {
    const campanha = await prisma.campanha.update({
      where: { id: params.id },
      data: { nome: nome.trim() },
    })
    return NextResponse.json({ nome: campanha.nome })
  } catch {
    return NextResponse.json({ error: 'Já existe uma campanha com esse nome.' }, { status: 409 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const campanha = await prisma.campanha.findUnique({ where: { id: params.id } })
  if (!campanha) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
  if (campanha.status === 'enviando') {
    return NextResponse.json({ error: 'Não é possível excluir uma campanha em envio.' }, { status: 409 })
  }

  await prisma.$transaction([
    prisma.envio.deleteMany({ where: { campanhaId: params.id } }),
    prisma.campanha.delete({ where: { id: params.id } }),
  ])

  return new NextResponse(null, { status: 204 })
}
