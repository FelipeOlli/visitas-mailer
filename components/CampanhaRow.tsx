'use client'

import { useRouter } from 'next/navigation'
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

interface Props {
  id: string
  nome: string
  status: string
  templateNome: string
  totalAlvo: number
  aberturas: number
  pct: number
  createdAt: string
}

export function CampanhaRow({ id, nome, status, templateNome, totalAlvo, aberturas, pct, createdAt }: Props) {
  const router = useRouter()

  async function handleExcluir(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm(`Excluir a campanha "${nome}" e todos os seus envios? Essa ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/campanhas/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error ?? 'Erro ao excluir.')
    } else {
      router.refresh()
    }
  }

  return (
    <tr className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#0d0d0d] transition-colors group">
      <td className="px-5 py-4">
        <Link href={`/campanhas/${id}`} className="font-medium text-sm text-[#fafafa] hover:text-[#ccf381] transition-colors">
          {nome}
        </Link>
        <p className="text-xs text-[#404040] mt-0.5">{new Date(createdAt).toLocaleDateString('pt-BR')}</p>
      </td>
      <td className="px-5 py-4 hidden sm:table-cell">
        <span className="text-xs text-[#525252]">{templateNome}</span>
      </td>
      <td className="px-5 py-4 text-right">
        <span className="text-sm text-[#fafafa]">{totalAlvo}</span>
      </td>
      <td className="px-5 py-4 text-right hidden md:table-cell">
        <span className="text-sm text-[#fafafa]">{aberturas}</span>
        <span className="text-xs text-[#525252] ml-1">({pct}%)</span>
      </td>
      <td className="px-5 py-4 text-right">
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[status] ?? STATUS_COLOR.rascunho}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
      </td>
      <td className="px-3 py-4 text-right">
        <button
          onClick={handleExcluir}
          disabled={status === 'enviando'}
          title={status === 'enviando' ? 'Não é possível excluir durante o envio' : 'Excluir campanha'}
          className="opacity-0 group-hover:opacity-100 text-[#404040] hover:text-red-400 transition-all disabled:opacity-20 p-1 rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </td>
    </tr>
  )
}
