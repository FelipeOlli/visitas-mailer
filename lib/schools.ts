import schoolsData from '../public/schools.json'

export interface School {
  sigla: string
  nome: string
  cre: string
  bairro: string
  endereco: string
  email?: string | null
  lat?: number | null
  lng?: number | null
}

export const schools = schoolsData as School[]

export function filterSchools(filtros: {
  cres?: string[]
  bairros?: string[]
  statusVisita?: string[]
  visitasMap?: Record<string, { status: string }>
}): School[] {
  return schools.filter(s => {
    if (!s.email) return false
    if (filtros.cres?.length && !filtros.cres.includes(s.cre)) return false
    if (filtros.bairros?.length && !filtros.bairros.includes(s.bairro)) return false
    if (filtros.statusVisita?.length && filtros.visitasMap) {
      const st = filtros.visitasMap[s.sigla]?.status ?? 'pendente'
      if (!filtros.statusVisita.includes(st)) return false
    }
    return true
  })
}

export function getCres(): string[] {
  return Array.from(new Set(schools.map(s => s.cre).filter(Boolean))).sort()
}

export function getBairros(): string[] {
  return Array.from(new Set(schools.map(s => s.bairro).filter(Boolean))).sort()
}
