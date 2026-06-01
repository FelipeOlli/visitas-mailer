import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome, templateId, filtros, totalAlvo, intervaloSegundos, tipoDestinatario, destinatarios } = await req.json()
  if (!nome || !templateId) return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })

  const tipo = tipoDestinatario === 'manual' ? 'manual' : 'escolas'

  if (tipo === 'manual') {
    const lista: Array<{ email: string; vars?: Record<string, string> }> = destinatarios ?? []
    if (!lista.length) return NextResponse.json({ error: 'Informe ao menos um e-mail.' }, { status: 400 })

    const campanha = await prisma.campanha.create({
      data: {
        nome,
        templateId,
        filtros: {},
        totalAlvo: lista.length,
        status: 'rascunho',
        intervaloSegundos: Math.max(10, Math.min(120, Number(intervaloSegundos) || 20)),
        tipoDestinatario: 'manual',
      },
    })

    await prisma.envio.createMany({
      data: lista.map((d, i) => ({
        id: `${campanha.id}-MANUAL-${i + 1}`,
        campanhaId: campanha.id,
        sigla: `MANUAL-${i + 1}`,
        email: d.email,
        status: 'pendente',
        ...(d.vars && Object.keys(d.vars).length > 0 ? { vars: d.vars } : {}),
      })),
    })

    return NextResponse.json(campanha, { status: 201 })
  }

  const campanha = await prisma.campanha.create({
    data: {
      nome,
      templateId,
      filtros,
      totalAlvo: totalAlvo ?? 0,
      status: 'rascunho',
      intervaloSegundos: Math.max(10, Math.min(120, Number(intervaloSegundos) || 20)),
      tipoDestinatario: 'escolas',
    },
  })
  return NextResponse.json(campanha, { status: 201 })
}
