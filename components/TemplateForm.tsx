'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Template {
  id: string
  nome: string
  assunto: string
  html: string
}

interface Props {
  template?: Template
}

const VARS_HELP = [
  { tag: '{{nome}}', desc: 'Nome da escola' },
  { tag: '{{sigla}}', desc: 'Sigla' },
  { tag: '{{cre}}', desc: 'CRE' },
  { tag: '{{bairro}}', desc: 'Bairro' },
  { tag: '{{endereco}}', desc: 'Endereço' },
]

export function TemplateForm({ template }: Props) {
  const router = useRouter()
  const [nome, setNome] = useState(template?.nome ?? '')
  const [assunto, setAssunto] = useState(template?.assunto ?? '')
  const [html, setHtml] = useState(template?.html ?? '')
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!nome || !assunto || !html) { setError('Preencha todos os campos.'); return }
    setLoading(true)
    setError('')
    const url = template ? `/api/templates/${template.id}` : '/api/templates'
    const method = template ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, assunto, html }),
    })
    setLoading(false)
    if (!res.ok) { setError('Erro ao salvar.'); return }
    router.push('/templates')
    router.refresh()
  }

  async function handleDelete() {
    if (!template) return
    if (!confirm('Deletar este template?')) return
    await fetch(`/api/templates/${template.id}`, { method: 'DELETE' })
    router.push('/templates')
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#737373] uppercase tracking-widest block mb-1.5">Nome do template</label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="ex: Convite para visita técnica"
            className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-[#ccf381] rounded-xl px-4 py-2.5 text-sm text-[#fafafa] placeholder-[#525252] outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-[#737373] uppercase tracking-widest block mb-1.5">Assunto do e-mail</label>
          <input
            value={assunto}
            onChange={e => setAssunto(e.target.value)}
            placeholder="ex: Visita técnica — {{nome}}"
            className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-[#ccf381] rounded-xl px-4 py-2.5 text-sm text-[#fafafa] placeholder-[#525252] outline-none transition-colors"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-[#737373] uppercase tracking-widest">HTML</label>
            <button
              onClick={() => setPreview(p => !p)}
              className="text-xs text-[#525252] hover:text-[#ccf381] transition-colors"
            >
              {preview ? 'Ver código' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <iframe
              srcDoc={html}
              className="w-full h-96 rounded-xl border border-[#262626] bg-white"
              sandbox="allow-same-origin"
            />
          ) : (
            <textarea
              value={html}
              onChange={e => setHtml(e.target.value)}
              rows={16}
              placeholder="<html>...</html>"
              className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-[#ccf381] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] outline-none transition-colors font-mono resize-y"
            />
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-[#ccf381] hover:bg-[#b8e06a] text-black font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar template'}
          </button>
          {template && (
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl text-sm text-red-400 border border-red-900/30 hover:bg-red-900/10 transition-colors"
            >
              Deletar
            </button>
          )}
        </div>
      </div>

      {/* Variáveis disponíveis */}
      <div className="rounded-[20px] bg-[#0a0a0a] border border-[#262626] p-5 h-fit">
        <p className="text-xs text-[#737373] uppercase tracking-widest mb-4">Variáveis disponíveis</p>
        <div className="space-y-2">
          {VARS_HELP.map(v => (
            <div key={v.tag} className="flex items-center gap-3">
              <code className="bg-[#121212] border border-[#262626] rounded-lg px-2.5 py-1 text-xs text-[#ccf381] font-mono">
                {v.tag}
              </code>
              <span className="text-xs text-[#525252]">{v.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#404040] mt-6">
          Use as variáveis no assunto e no HTML. Cada escola receberá o e-mail personalizado com seus dados.
        </p>
      </div>
    </div>
  )
}
