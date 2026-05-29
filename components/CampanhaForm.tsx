'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Template { id: string; nome: string }

interface Props { templates: Template[] }

const STATUS_VISITA = ['pendente', 'visitado', 'tentativa', 'reagendado']

export function CampanhaForm({ templates }: Props) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [cresAll, setCresAll] = useState<string[]>([])
  const [cresCounts, setCresCounts] = useState<Record<string, number>>({})
  const [bairrosAll, setBairrosAll] = useState<string[]>([])
  const [selectedCres, setSelectedCres] = useState<string[]>([])
  const [selectedBairros, setSelectedBairros] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [totalAlvo, setTotalAlvo] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/escolas-filtradas')
      .then(r => r.json())
      .then(d => {
        setCresAll(d.cresAll)
        setCresCounts(d.cresCounts ?? {})
        setBairrosAll(d.bairrosAll)
        setTotalAlvo(d.total)
      })
  }, [])

  const fetchCount = useCallback(async (cres: string[], bairros: string[], status: string[]) => {
    const params = new URLSearchParams()
    if (cres.length) params.set('cres', cres.join(','))
    if (bairros.length) params.set('bairros', bairros.join(','))
    if (status.length) params.set('statusVisita', status.join(','))
    const res = await fetch('/api/escolas-filtradas?' + params)
    const d = await res.json()
    setTotalAlvo(d.total)
  }, [])

  function toggleItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
  }

  function handleCre(cre: string) {
    const next = toggleItem(selectedCres, cre)
    setSelectedCres(next)
    fetchCount(next, selectedBairros, selectedStatus)
  }

  function handleBairro(b: string) {
    const next = toggleItem(selectedBairros, b)
    setSelectedBairros(next)
    fetchCount(selectedCres, next, selectedStatus)
  }

  function handleStatus(s: string) {
    const next = toggleItem(selectedStatus, s)
    setSelectedStatus(next)
    fetchCount(selectedCres, selectedBairros, next)
  }

  async function handleSave() {
    if (!nome || !templateId) { setError('Preencha nome e template.'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/campanhas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        templateId,
        filtros: {
          cres: selectedCres,
          bairros: selectedBairros,
          statusVisita: selectedStatus,
        },
        totalAlvo: totalAlvo ?? 0,
      }),
    })
    setLoading(false)
    if (!res.ok) { setError('Erro ao salvar.'); return }
    const data = await res.json()
    router.push(`/campanhas/${data.id}`)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configurações */}
      <div className="lg:col-span-2 space-y-5">
        <div className="rounded-[20px] bg-[#0a0a0a] border border-[#262626] p-5 space-y-4">
          <p className="text-xs text-[#737373] uppercase tracking-widest">Identificação</p>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Nome da campanha"
            className="w-full bg-[#121212] border border-[#262626] focus:border-[#ccf381] rounded-xl px-4 py-2.5 text-sm text-[#fafafa] placeholder-[#525252] outline-none transition-colors"
          />
          <select
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
            className="w-full bg-[#121212] border border-[#262626] focus:border-[#ccf381] rounded-xl px-4 py-2.5 text-sm text-[#fafafa] outline-none transition-colors"
          >
            {templates.length === 0 && <option value="">Nenhum template cadastrado</option>}
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>

        {/* Filtro CRE */}
        <div className="rounded-[20px] bg-[#0a0a0a] border border-[#262626] p-5">
          <p className="text-xs text-[#737373] uppercase tracking-widest mb-3">
            Filtrar por CRE {selectedCres.length > 0 && <span className="text-[#ccf381]">· {selectedCres.length} selecionada{selectedCres.length !== 1 ? 's' : ''}</span>}
          </p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {cresAll.map(cre => (
              <button
                key={cre}
                onClick={() => handleCre(cre)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCres.includes(cre)
                    ? 'bg-[#ccf381] text-black'
                    : 'bg-[#121212] text-[#737373] border border-[#262626] hover:border-[#404040] hover:text-[#fafafa]'
                }`}
              >
                {cre}
                {cresCounts[cre] != null && (
                  <span className={`ml-1.5 ${selectedCres.includes(cre) ? 'text-black/60' : 'text-[#404040]'}`}>
                    {cresCounts[cre]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#404040] mt-2">Deixe em branco para incluir todas as CREs</p>
        </div>

        {/* Filtro Status visita */}
        <div className="rounded-[20px] bg-[#0a0a0a] border border-[#262626] p-5">
          <p className="text-xs text-[#737373] uppercase tracking-widest mb-3">
            Filtrar por status de visita {selectedStatus.length > 0 && <span className="text-[#ccf381]">· {selectedStatus.length} selecionado{selectedStatus.length !== 1 ? 's' : ''}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_VISITA.map(s => (
              <button
                key={s}
                onClick={() => handleStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedStatus.includes(s)
                    ? 'bg-[#ccf381] text-black'
                    : 'bg-[#121212] text-[#737373] border border-[#262626] hover:border-[#404040] hover:text-[#fafafa]'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#404040] mt-2">Deixe em branco para ignorar o status</p>
        </div>

        {/* Filtro Bairro */}
        <div className="rounded-[20px] bg-[#0a0a0a] border border-[#262626] p-5">
          <p className="text-xs text-[#737373] uppercase tracking-widest mb-3">
            Filtrar por bairro {selectedBairros.length > 0 && <span className="text-[#ccf381]">· {selectedBairros.length} selecionado{selectedBairros.length !== 1 ? 's' : ''}</span>}
          </p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {bairrosAll.map(b => (
              <button
                key={b}
                onClick={() => handleBairro(b)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedBairros.includes(b)
                    ? 'bg-[#ccf381] text-black'
                    : 'bg-[#121212] text-[#737373] border border-[#262626] hover:border-[#404040] hover:text-[#fafafa]'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#404040] mt-2">Deixe em branco para incluir todos os bairros</p>
        </div>
      </div>

      {/* Sidebar — resumo + ação */}
      <div className="space-y-4">
        <div className="rounded-[20px] bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#262626] p-6 text-center">
          <p className="text-xs text-[#737373] uppercase tracking-widest mb-1">Escolas atingidas</p>
          <p className="font-display text-6xl font-bold text-[#ccf381] tracking-tighter leading-none">
            {totalAlvo ?? '—'}
          </p>
          <p className="text-xs text-[#525252] mt-2">com e-mail válido</p>
        </div>

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}

        <button
          onClick={handleSave}
          disabled={loading || templates.length === 0}
          className="w-full bg-[#ccf381] hover:bg-[#b8e06a] text-black font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar como rascunho'}
        </button>

        <p className="text-xs text-[#404040] text-center">
          O disparo é feito na página da campanha depois de revisada.
        </p>
      </div>
    </div>
  )
}
