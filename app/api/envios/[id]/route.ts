import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status, erro } = await req.json()

  const data: Record<string, unknown> = { status }
  if (status === 'enviado') data.enviadoEm = new Date()
  if (erro) data.erro = erro

  const envio = await prisma.envio.update({ where: { id: params.id }, data })

  // Se todos os envios da campanha foram processados, marca como concluída
  const pendentes = await prisma.envio.count({
    where: { campanhaId: envio.campanhaId, status: 'pendente' },
  })
  if (pendentes === 0) {
    await prisma.campanha.update({
      where: { id: envio.campanhaId },
      data: { status: 'concluida' },
    })
  }

  return NextResponse.json(envio)
}
