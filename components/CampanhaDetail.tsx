'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function formatEta(seg: number): string {
  if (seg <= 0) return 'concluindo...'
  const h = Math.floor(seg / 3600)
  const m = Math.round((seg % 3600) / 60)
  if (h > 0) return `~${h}h ${m}min`
  if (m > 0) return `~${m}min`
  return `~${seg}s`
}

interface CampanhaProps {
  id: string
  nome: string
  status: string
  totalAlvo: number
  templateNome: string
  intervaloSegundos: number
  filtros: Record<string, string[]>
  tipoDestinatario: string
  createdAt: string
}

interface EnvioRow {
  id: string
  sigla: string
  email: string
  status: string
  enviadoEm: string | null
  abertoEm: string | null
  erro: string | null
}

interface Props {
  campanha: CampanhaProps
  envios: EnvioRow[]
  counts: { pendente: number; enviado: number; abriu: number; falhou: number }
}

const STATUS_COLOR: Record<string, string> = {
  rascunho: 'text-[#737373] bg-[#1a1a1a]',
  enviando: 'text-yellow-400 bg-yellow-900/20',
  concluida: 'text-[#ccf381] bg-[#ccf381]/10',
  pausada: 'text-red-400 bg-red-900/20',
}

const ENVIO_COLOR: Record<string, string> = {
  pendente: 'text-[#737373]',
  enviado: 'text-blue-400',
  abriu: 'text-[#ccf381]',
  falhou: 'text-red-400',
}

export function CampanhaDetail({ campanha, envios, counts }: Props) {
  const router = useRouter()
  const [disparando, setDisparando] = useState(false)
  const [filterStatus, setFilterStatus] = useState('todos')
  const [msg, setMsg] = useState('')
  const [emailTeste, setEmailTeste] = useState('')
  const [enviandoTeste, setEnviandoTeste] = useState(false)
  const [msgTeste, setMsgTeste] = useState('')

  async function handleTestar() {
    setEnviandoTeste(true)
    setMsgTeste('')
    const res = await fetch(`/api/campanhas/${campanha.id}/testar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailTeste }),
    })
    setEnviandoTeste(false)
    if (!res.ok) {
      const d = await res.json()
      setMsgTeste('Erro: ' + (d.error ?? 'desconhecido'))
    } else {
      setMsgTeste(`Teste enviado para ${emailTeste}`)
    }
  }

  useEffect(() => {
    if (campanha.status !== 'enviando') return
    const id = setInterval(() => router.refresh(), 10000)
    return () => clearInterval(id)
  }, [campanha.status, router])

  const processados = counts.enviado + counts.abriu + counts.falhou
  const pct = campanha.totalAlvo > 0 ? (processados / campanha.totalAlvo) * 100 : 0
  const restantes = campanha.totalAlvo - processados
  const pctAbertura = campanha.totalAlvo > 0 ? Math.round((counts.abriu / campanha.totalAlvo) * 100) : 0
  const canDispatch = campanha.status === 'rascunho' || campanha.status === 'pausada'
  const canReiniciar =
    (campanha.status === 'enviando' || campanha.status === 'concluida') &&
    (counts.pendente > 0 || counts.falhou > 0)
  const canDelete = campanha.status !== 'enviando'

  async function handleExcluir() {
    if (!confirm(`Excluir a campanha "${campanha.nome}" e todos os seus envios? Essa ação não pode ser desfeita.`)) return
    setDisparando(true)
    const res = await fetch(`/api/campanhas/${campanha.id}`, { method: 'DELETE' })
    setDisparando(false)
    if (!res.ok) {
      const d = await res.json()
      setMsg('Erro: ' + (d.error ?? 'desconhecido'))
    } else {
      router.push('/campanhas')
      router.refresh()
    }
  }

  async function handleDisparar() {
    if (!confirm(`Disparar para ${campanha.totalAlvo} escolas?`)) return
    setDisparando(true)
    setMsg('')
    const res = await fetch(`/api/campanhas/${campanha.id}/disparar`, { method: 'POST' })
    setDisparando(false)
    if (!res.ok) {
      const d = await res.json()
      setMsg('Erro: ' + (d.error ?? 'desconhecido'))
    } else {
      const d = await res.json()
      setMsg(`Disparo iniciado — ${d.disparados} envios criados. O n8n processará em background.`)
      router.refresh()
    }
  }

  async function handleReiniciar() {
    const qtd = counts.pendente + counts.falhou
    if (!confirm(`Recriar e reenviar ${qtd} envio(s) pendente(s)/falho(s)?`)) return
    setDisparando(true)
    setMsg('')
    const res = await fetch(`/api/campanhas/${campanha.id}/reiniciar`, { method: 'POST' })
    setDisparando(false)
    if (!res.ok) {
      const d = await res.json()
      setMsg('Erro: ' + (d.error ?? 'desconhecido'))
    } else {
      const d = await res.json()
      setMsg(`Reenvio iniciado — ${d.disparados} envios recriados. O n8n processará em background.`)
      router.refresh()
    }
  }

  function exportCsv() {
    const rows = [['ID', 'Sigla', 'E-mail', 'Status', 'Enviado em', 'Aberto em', 'Erro']]
    for (const e of envios) {
      rows.push([e.id, e.sigla, e.email, e.status, e.enviadoEm ?? '', e.abertoEm ?? '', e.erro ?? ''])
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `${campanha.nome}.csv`
    a.click()
  }

  const filtered = filterStatus === 'todos' ? envios : envios.filter(e => e.status === filterStatus)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{campanha.nome}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[campanha.status] ?? STATUS_COLOR.rascunho}`}>
              {campanha.status.charAt(0).toUpperCase() + campanha.status.slice(1)}
            </span>
            {campanha.tipoDestinatario === 'manual' && (
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium text-purple-400 bg-purple-900/20">
                Lista manual
              </span>
            )}
            <span className="text-xs text-[#525252]">Template: {campanha.templateNome}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {canDispatch && (
            <button
              onClick={handleDisparar}
              disabled={disparando}
              className="bg-[#ccf381] hover:bg-[#b8e06a] text-black font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {disparando ? 'Disparando...' : 'Disparar agora'}
            </button>
          )}
          {canReiniciar && (
            <button
              onClick={handleReiniciar}
              disabled={disparando}
              className="bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400 font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {disparando ? 'Reiniciando...' : 'Reiniciar envio'}
            </button>
          )}
          <button
            onClick={handleExcluir}
            disabled={disparando || !canDelete}
            title={!canDelete ? 'Não é possível excluir durante o envio' : 'Excluir campanha'}
            className="bg-transparent hover:bg-red-950/40 border border-[#262626] hover:border-red-900 text-[#737373] hover:text-red-400 font-semibold rounded-xl px-3 py-2.5 text-sm transition-colors disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
      {msg && <p className="text-xs text-[#ccf381] bg-[#ccf381]/10 rounded-xl px-4 py-3">{msg}</p>}
      {counts.falhou > 0 && (
        <div className="rounded-xl bg-red-950/30 border border-red-900/50 px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-red-400">{counts.falhou} envio(s) falharam</p>
          {envios.filter(e => e.erro).slice(0, 3).map(e => (
            <p key={e.id} className="text-xs text-red-400/70 font-mono">{e.sigla}: {e.erro}</p>
          ))}
          {counts.falhou > 3 && (
            <p className="text-xs text-red-400/50">… e mais {counts.falhou - 3}. Use o filtro &quot;Falhou&quot; para ver todos.</p>
          )}
        </div>
      )}

      {/* Barra de progresso */}
      {(campanha.status === 'enviando' || (processados > 0 && processados < campanha.totalAlvo)) && (
        <div className="rounded-[20px] bg-[#0a0a0a] border border-[#262626] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {campanha.status === 'enviando' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ccf381] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ccf381]" />
                </span>
              )}
              <p className="text-xs text-[#525252] uppercase tracking-widest">Progresso</p>
            </div>
            <p className="text-xs text-[#737373]">
              {processados}/{campanha.totalAlvo}
              {campanha.status === 'enviando' && restantes > 0 && (
                <span className="text-[#404040]"> • ETA {formatEta(restantes * campanha.intervaloSegundos)}</span>
              )}
            </p>
          </div>
          <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#ccf381] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-[#404040]">{Math.round(pct)}% concluído</p>
        </div>
      )}

      {/* Envio de teste */}
      <div className="rounded-[20px] bg-[#0a0a0a] border border-[#262626] p-5 space-y-3">
        <p className="text-xs text-[#525252] uppercase tracking-widest">Envio de teste</p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="seu@email.com"
            value={emailTeste}
            onChange={e => setEmailTeste(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && emailTeste && !enviandoTeste && handleTestar()}
            className="flex-1 bg-[#121212] border border-[#262626] rounded-xl px-4 py-2 text-sm text-[#fafafa] placeholder:text-[#404040] focus:outline-none focus:border-[#404040]"
          />
          <button
            onClick={handleTestar}
            disabled={!emailTeste || enviandoTeste}
            className="bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] text-[#fafafa] font-medium rounded-xl px-4 py-2 text-sm transition-colors disabled:opacity-40 shrink-0"
          >
            {enviandoTeste ? 'Enviando...' : 'Enviar teste'}
          </button>
        </div>
        {msgTeste && (
          <p className={`text-xs ${msgTeste.startsWith('Erro') ? 'text-red-400' : 'text-[#ccf381]'}`}>
            {msgTeste}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Alvo', value: campanha.totalAlvo, color: '#fafafa' },
          { label: 'Enviados', value: counts.enviado + counts.abriu, color: '#60a5fa' },
          { label: 'Abriram', value: counts.abriu, color: '#ccf381' },
          { label: 'Taxa abertura', value: `${pctAbertura}%`, color: '#ccf381' },
        ].map(s => (
          <div key={s.label} className="rounded-[20px] bg-[#0a0a0a] border border-[#262626] p-5">
            <p className="text-xs text-[#525252] uppercase tracking-widest mb-1">{s.label}</p>
            <p className="font-display text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtro + exportar */}
      {envios.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {['todos', 'pendente', 'enviado', 'abriu', 'falhou'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filterStatus === s
                    ? 'bg-[#ccf381] text-black'
                    : 'bg-[#121212] text-[#737373] border border-[#262626] hover:border-[#404040] hover:text-[#fafafa]'
                }`}
              >
                {s === 'todos' ? `Todos (${envios.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s as keyof typeof counts] ?? 0})`}
              </button>
            ))}
          </div>
          <button
            onClick={exportCsv}
            className="text-xs text-[#525252] hover:text-[#fafafa] transition-colors border border-[#262626] hover:border-[#404040] rounded-xl px-3 py-1.5"
          >
            Exportar CSV
          </button>
        </div>
      )}

      {/* Tabela de envios */}
      {envios.length === 0 ? (
        <div className="rounded-[28px] bg-[#0a0a0a] border border-[#262626] p-10 text-center">
          <p className="text-[#525252] text-sm">Nenhum envio ainda. Clique em &quot;Disparar agora&quot; para iniciar.</p>
        </div>
      ) : (
        <div className="rounded-[28px] bg-[#0a0a0a] border border-[#262626] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="text-left text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3">Escola</th>
                <th className="text-left text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3 hidden sm:table-cell">E-mail</th>
                <th className="text-right text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3">Status</th>
                <th className="text-right text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3 hidden md:table-cell">Enviado</th>
                <th className="text-right text-xs text-[#525252] font-medium uppercase tracking-widest px-5 py-3 hidden lg:table-cell">Aberto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#0d0d0d] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-[#737373]">{e.sigla}</td>
                  <td className="px-5 py-3 text-xs text-[#525252] hidden sm:table-cell">{e.email}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-xs font-medium ${ENVIO_COLOR[e.status] ?? ENVIO_COLOR.pendente}`}>
                      {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                    </span>
                    {e.erro && <p className="text-xs text-red-400 mt-0.5">{e.erro}</p>}
                  </td>
                  <td className="px-5 py-3 text-right hidden md:table-cell">
                    <span className="text-xs text-[#404040]">
                      {e.enviadoEm ? new Date(e.enviadoEm).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right hidden lg:table-cell">
                    <span className="text-xs text-[#404040]">
                      {e.abertoEm ? (
                        <>
                          {new Date(e.abertoEm).toLocaleDateString('pt-BR')}
                          <span className="text-[#525252] ml-1">
                            {new Date(e.abertoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      ) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
