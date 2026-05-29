import { prisma } from '@/lib/prisma'
import { filterSchools } from '@/lib/schools'

export class DispararError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
  }
}

export async function dispararCampanha(campanhaId: string): Promise<{ disparados: number }> {
  const campanha = await prisma.campanha.findUnique({
    where: { id: campanhaId },
    include: { template: true },
  })
  if (!campanha) throw new DispararError('Campanha não encontrada', 404)
  if (campanha.status !== 'rascunho' && campanha.status !== 'pausada') {
    throw new DispararError('Campanha não está em rascunho ou pausada', 400)
  }

  const filtros = campanha.filtros as { cres?: string[]; bairros?: string[]; statusVisita?: string[] }
  const schools = filterSchools(filtros)

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

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) throw new DispararError('N8N_WEBHOOK_URL não configurada', 500)

  const payload = {
    campanhaId: campanha.id,
    template: { assunto: campanha.template.assunto, html: campanha.template.html },
    envios: envios.map(e => ({ id: e.id, email: e.email, sigla: e.sigla })),
    schools: schools.reduce((acc, s) => {
      acc[s.sigla] = { nome: s.nome, cre: s.cre, bairro: s.bairro }
      return acc
    }, {} as Record<string, { nome: string; cre: string; bairro: string }>),
    pixelBase: process.env.NEXTAUTH_URL + '/api/pixel',
    intervaloSegundos: campanha.intervaloSegundos,
  }

  const n8nRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!n8nRes.ok) {
    await prisma.campanha.update({ where: { id: campanha.id }, data: { status: 'pausada' } })
    throw new DispararError('Falha ao acionar n8n', 502)
  }

  return { disparados: envios.length }
}
