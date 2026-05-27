import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/SignOutButton'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/templates" className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ccf381]" />
              <span className="font-display font-semibold text-sm text-[#fafafa]">Visitas Mailer</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/templates" className="px-3 py-1.5 rounded-lg text-xs text-[#737373] hover:text-[#fafafa] hover:bg-[#1a1a1a] transition-all">
                Templates
              </Link>
              <Link href="/campanhas" className="px-3 py-1.5 rounded-lg text-xs text-[#737373] hover:text-[#fafafa] hover:bg-[#1a1a1a] transition-all">
                Campanhas
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-[#525252]">{session.user?.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
