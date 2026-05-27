'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('E-mail ou senha incorretos.')
    } else {
      router.push('/templates')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-[32px] bg-[#0a0a0a] border border-[#262626] p-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#121212] border border-[#262626] rounded-full px-3 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#ccf381]" />
            <span className="text-xs text-[#737373] font-medium">Visitas Mailer</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Entrar</h1>
          <p className="text-sm text-[#525252] mt-1">Acesso restrito ao administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-[#121212] border border-[#262626] focus:border-[#ccf381] rounded-xl px-4 py-2.5 text-sm text-[#fafafa] placeholder-[#525252] outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-[#121212] border border-[#262626] focus:border-[#ccf381] rounded-xl px-4 py-2.5 text-sm text-[#fafafa] placeholder-[#525252] outline-none transition-colors"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ccf381] hover:bg-[#b8e06a] text-black font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
