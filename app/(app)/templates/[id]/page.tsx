import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { TemplateForm } from '@/components/TemplateForm'

export default async function TemplateEditPage({ params }: { params: { id: string } }) {
  const template = await prisma.template.findUnique({ where: { id: params.id } })
  if (!template) notFound()

  return (
    <div className="p-4 lg:p-6">
      <h1 className="font-display text-2xl font-bold mb-6">Editar template</h1>
      <TemplateForm template={template} />
    </div>
  )
}
