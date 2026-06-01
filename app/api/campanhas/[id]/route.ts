import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
