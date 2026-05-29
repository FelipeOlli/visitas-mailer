import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { CampanhaDetail } from '@/components/CampanhaDetail'

export default async function CampanhaDetailPage({ params }: { params: { id: string } }) {
  const campanha = await prisma.campanha.findUnique({
    where: { id: params.id },
    include: { template: { select: { nome: true } } },
  })
  if (!campanha) notFound()

  const envios = await prisma.envio.findMany({
    where: { campanhaId: params.id },
    orderBy: { enviadoEm: 'desc' },
  })

  const counts = {
    pendente: envios.filter(e => e.status === 'pendente').length,
    enviado: envios.filter(e => e.status === 'enviado').length,
    abriu: envios.filter(e => e.status === 'abriu').length,
    falhou: envios.filter(e => e.status === 'falhou').length,
  }

  return (
    <CampanhaDetail
      campanha={{
        id: campanha.id,
        nome: campanha.nome,
        status: campanha.status,
        totalAlvo: campanha.totalAlvo,
        templateNome: campanha.template.nome,
        filtros: campanha.filtros as Record<string, string[]>,
        createdAt: campanha.createdAt.toISOString(),
        intervaloSegundos: campanha.intervaloSegundos,
      }}
      envios={envios.map(e => ({
        id: e.id,
        sigla: e.sigla,
        email: e.email,
        status: e.status,
        enviadoEm: e.enviadoEm?.toISOString() ?? null,
        abertoEm: e.abertoEm?.toISOString() ?? null,
        erro: e.erro,
      }))}
      counts={counts}
    />
  )
}
