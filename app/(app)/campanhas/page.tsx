import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  enviando: 'Enviando',
  concluida: 'Concluída',
  pausada: 'Pausada',
}

const STATUS_COLOR: Record<string, string> = {
  rascunho: 'text-[#737373] bg-[#1a1a1a]',
  enviando: 'text-yellow-400 bg-yellow-900/20',
  concluida: 'text-[#ccf381] bg-[#ccf381]/10',
  pausada: 'text-red-400 bg-red-900/20',
}

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
                <th className="text-right text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3 hidden md:table-cell">Aberturas</th>
                <th className="text-right text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {campanhas.map(c => {
                const aberturas = aberturasMap[c.id] ?? 0
                const pct = c.totalAlvo > 0 ? Math.round((aberturas / c.totalAlvo) * 100) : 0
                return (
                  <tr key={c.id} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#0d0d0d] transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/campanhas/${c.id}`} className="font-medium text-sm text-[#fafafa] hover:text-[#ccf381] transition-colors">
                        {c.nome}
                      </Link>
                      <p className="text-xs text-[#404040] mt-0.5">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-xs text-[#525252]">{c.template.nome}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm text-[#fafafa]">{c.totalAlvo}</span>
                    </td>
                    <td className="px-5 py-4 text-right hidden md:table-cell">
                      <span className="text-sm text-[#fafafa]">{aberturas}</span>
                      <span className="text-xs text-[#525252] ml-1">({pct}%)</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[c.status] ?? STATUS_COLOR.rascunho}`}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
