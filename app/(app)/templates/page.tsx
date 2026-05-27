import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Templates</h1>
          <p className="text-sm text-[#525252] mt-0.5">{templates.length} template{templates.length !== 1 ? 's' : ''} cadastrado{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/templates/novo"
          className="bg-[#ccf381] hover:bg-[#b8e06a] text-black font-semibold rounded-xl px-4 py-2 text-sm transition-colors"
        >
          + Novo template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-[28px] bg-[#0a0a0a] border border-[#262626] p-12 text-center">
          <p className="text-[#525252]">Nenhum template ainda.</p>
          <Link href="/templates/novo" className="text-[#ccf381] text-sm mt-2 inline-block hover:underline">
            Criar o primeiro
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <Link
              key={t.id}
              href={`/templates/${t.id}`}
              className="rounded-[20px] bg-[#0a0a0a] border border-[#262626] hover:border-[#404040] p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-start justify-between">
                <span className="font-display font-semibold text-[#fafafa] group-hover:text-[#ccf381] transition-colors line-clamp-1">
                  {t.nome}
                </span>
              </div>
              <p className="text-xs text-[#525252] line-clamp-1">Assunto: {t.assunto}</p>
              <p className="text-xs text-[#404040] mt-auto">
                {new Date(t.updatedAt).toLocaleDateString('pt-BR')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
