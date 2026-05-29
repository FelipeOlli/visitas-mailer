import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dispararCampanha, DispararError } from '@/lib/disparar'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const campanha = await prisma.campanha.findUnique({ where: { id: params.id } })
  if (!campanha) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

  // Apaga envios pendentes/falhos — preserva enviados e abertos
  await prisma.envio.deleteMany({
    where: { campanhaId: params.id, status: { in: ['pendente', 'falhou'] } },
  })

  // Volta para rascunho para que dispararCampanha possa rodar
  await prisma.campanha.update({
    where: { id: params.id },
    data: { status: 'rascunho' },
  })

  try {
    const result = await dispararCampanha(params.id)
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof DispararError) return NextResponse.json({ error: e.message }, { status: e.status })
    throw e
  }
}
