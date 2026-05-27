import { prisma } from '@/lib/prisma'
import { CampanhaForm } from '@/components/CampanhaForm'

export default async function NovaCampanhaPage() {
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, nome: true },
  })

  return (
    <div className="p-4 lg:p-6">
      <h1 className="font-display text-2xl font-bold mb-6">Nova campanha</h1>
      <CampanhaForm templates={templates} />
    </div>
  )
}
