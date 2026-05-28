import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { email } = await req.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }

  const campanha = await prisma.campanha.findUnique({
    where: { id: params.id },
    include: { template: true },
  })
  if (!campanha) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'N8N_WEBHOOK_URL não configurada' }, { status: 500 })
  }

  const testId = `teste-${campanha.id}`
  const payload = {
    campanhaId: campanha.id,
    template: { assunto: `[TESTE] ${campanha.template.assunto}`, html: campanha.template.html },
    envios: [{ id: testId, email, sigla: 'TESTE' }],
    schools: {
      TESTE: { nome: 'Escola Teste', cre: '1ª CRE', bairro: 'Centro' },
    },
    pixelBase: process.env.NEXTAUTH_URL + '/api/pixel',
  }

  const n8nRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!n8nRes.ok) {
    return NextResponse.json({ error: 'Falha ao acionar n8n' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
