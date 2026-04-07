import Link from 'next/link'

const NAV_LINKS = [
  { href: '/privacy',         label: 'Політика конфіденційності' },
  { href: '/terms',           label: 'Умови використання' },
  { href: '/data-compliance', label: 'Дані та відповідність' },
]

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-gray-950/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs shadow-lg shadow-pink-500/20">
              🌸
            </div>
            <span className="text-sm font-bold tracking-tight text-white">FlowerGoUa</span>
          </Link>
          <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors">
            ← Головна
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-12 lg:py-16 flex flex-col lg:flex-row gap-10">

        {/* Sidebar nav */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="lg:sticky lg:top-24">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3 px-1">Правові документи</p>
            <nav className="space-y-0.5">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href}
                  className="block px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 pt-6 border-t border-white/[0.06] px-1">
              <p className="text-[10px] text-gray-700 leading-relaxed">
                Питання щодо наших правових документів? Напишіть нам на{' '}
                <a href="mailto:legal@flowergoua.com" className="text-gray-500 hover:text-white transition-colors underline">
                  legal@flowergoua.com
                </a>
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] mt-12">
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs">🌸</div>
            <span className="text-sm font-bold text-white">FlowerGoUa</span>
          </div>
          <p className="text-xs text-gray-700">© {new Date().getFullYear()} FlowerGoUa. Всі права захищені.</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="/privacy"         className="hover:text-white transition-colors">Конфіденційність</Link>
            <Link href="/terms"           className="hover:text-white transition-colors">Умови</Link>
            <Link href="/data-compliance" className="hover:text-white transition-colors">Дані</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
