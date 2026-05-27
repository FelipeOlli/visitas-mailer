import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { nome, templateId, filtros, totalAlvo } = await req.json()
  if (!nome || !templateId) return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })

  const campanha = await prisma.campanha.create({
    data: { nome, templateId, filtros, totalAlvo: totalAlvo ?? 0, status: 'rascunho' },
  })
  return NextResponse.json(campanha, { status: 201 })
}
