import { NextRequest, NextResponse } from 'next/server'
import { filterSchools, getCres, getBairros, getCresCounts } from '@/lib/schools'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const cres = searchParams.get('cres')?.split(',').filter(Boolean) ?? []
  const bairros = searchParams.get('bairros')?.split(',').filter(Boolean) ?? []
  const statusVisita = searchParams.get('statusVisita')?.split(',').filter(Boolean) ?? []

  const filtered = filterSchools({ cres, bairros, statusVisita })

  return NextResponse.json({
    total: filtered.length,
    schools: filtered,
    cresAll: getCres(),
    cresCounts: getCresCounts(),
    bairrosAll: getBairros(),
  })
}
