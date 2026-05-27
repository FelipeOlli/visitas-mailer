import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Transparent 1x1 GIF
const GIF_1x1 = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const envio = await prisma.envio.findUnique({ where: { id } })
    if (envio && !envio.abertoEm) {
      await prisma.envio.update({
        where: { id },
        data: { abertoEm: new Date(), status: 'abriu' },
      })
    }
  } catch {
    // silently ignore — pixel must always respond
  }

  return new NextResponse(GIF_1x1, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
