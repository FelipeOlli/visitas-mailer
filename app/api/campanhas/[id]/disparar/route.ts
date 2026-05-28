import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { filterSchools } from '@/lib/schools'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const campanha = await prisma.campanha.findUnique({
    where: { id: params.id },
    include: { template: true },
  })
  if (!campanha) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  if (campanha.status !== 'rascunho' && campanha.status !== 'pausada') {
    return NextResponse.json({ error: 'Campanha já foi disparada' }, { status: 400 })
  }

  const filtros = campanha.filtros as { cres?: string[]; bairros?: string[]; statusVisita?: string[] }
  const schools = filterSchools(filtros)

  // Cria os registros de envio (pendente) em batch
  await prisma.campanha.update({
    where: { id: campanha.id },
    data: { status: 'enviando', totalAlvo: schools.length },
  })

  const envios = await prisma.$transaction(
    schools.map(s => {
      const safeId = `${campanha.id}-${s.sigla.replace(/[^a-zA-Z0-9]/g, '_')}`
      return prisma.envio.upsert({
        where: { id: safeId },
        create: { id: safeId, campanhaId: campanha.id, sigla: s.sigla, email: s.email!, status: 'pendente' },
        update: {},
      })
    })
  )

  // Chama o webhook do n8n
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'N8N_WEBHOOK_URL não configurada' }, { status: 500 })
  }

  const payload = {
    campanhaId: campanha.id,
    template: { assunto: campanha.template.assunto, html: campanha.template.html },
    envios: envios.map(e => ({
      id: e.id,
      email: e.email,
      sigla: e.sigla,
    })),
    schools: schools.reduce((acc, s) => {
      acc[s.sigla] = { nome: s.nome, cre: s.cre, bairro: s.bairro }
      return acc
    }, {} as Record<string, { nome: string; cre: string; bairro: string }>),
    pixelBase: process.env.NEXTAUTH_URL + '/api/pixel',
  }

  const n8nRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!n8nRes.ok) {
    await prisma.campanha.update({ where: { id: campanha.id }, data: { status: 'pausada' } })
    return NextResponse.json({ error: 'Falha ao acionar n8n' }, { status: 502 })
  }

  return NextResponse.json({ disparados: envios.length })
}
