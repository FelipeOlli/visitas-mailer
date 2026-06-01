import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CampanhaRow } from '@/components/CampanhaRow'

export default async function CampanhasPage() {
  const campanhas = await prisma.campanha.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { nome: true } },
      _count: { select: { envios: true } },
    },
  })

  const aberturasCounts = await prisma.envio.groupBy({
    by: ['campanhaId'],
    where: { status: 'abriu' },
    _count: { id: true },
  })
  const aberturasMap = Object.fromEntries(aberturasCounts.map(a => [a.campanhaId, a._count.id]))

  const enviadosCounts = await prisma.envio.groupBy({
    by: ['campanhaId'],
    where: { status: { in: ['enviado', 'abriu'] } },
    _count: { id: true },
  })
  const enviadosMap = Object.fromEntries(enviadosCounts.map(e => [e.campanhaId, e._count.id]))

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Campanhas</h1>
          <p className="text-sm text-[#525252] mt-0.5">{campanhas.length} campanha{campanhas.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/campanhas/nova"
          className="bg-[#ccf381] hover:bg-[#b8e06a] text-black font-semibold rounded-xl px-4 py-2 text-sm transition-colors"
        >
          + Nova campanha
        </Link>
      </div>

      {campanhas.length === 0 ? (
        <div className="rounded-[28px] bg-[#0a0a0a] border border-[#262626] p-12 text-center">
          <p className="text-[#525252]">Nenhuma campanha ainda.</p>
          <Link href="/campanhas/nova" className="text-[#ccf381] text-sm mt-2 inline-block hover:underline">
            Criar a primeira
          </Link>
        </div>
      ) : (
        <div className="rounded-[28px] bg-[#0a0a0a] border border-[#262626] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="text-left text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3">Campanha</th>
                <th className="text-left text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3 hidden sm:table-cell">Template</th>
                <th className="text-right text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3">Alvo</th>
                <th className="text-right text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3 hidden md:table-cell">Enviados</th>
                <th className="text-right text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3 hidden md:table-cell">Aberturas</th>
                <th className="text-right text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3">Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {campanhas.map(c => {
                const aberturas = aberturasMap[c.id] ?? 0
                const enviados = enviadosMap[c.id] ?? 0
                const pct = c.totalAlvo > 0 ? Math.round((aberturas / c.totalAlvo) * 100) : 0
                return (
                  <CampanhaRow
                    key={c.id}
                    id={c.id}
                    nome={c.nome}
                    status={c.status}
                    templateNome={c.template.nome}
                    totalAlvo={c.totalAlvo}
                    enviados={enviados}
                    aberturas={aberturas}
                    pct={pct}
                    createdAt={c.createdAt.toISOString()}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
