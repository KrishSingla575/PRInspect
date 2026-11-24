import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

const pageTitles: Record<string, string> = {
  '/home': 'Overview',
  '/repositories': 'Repositories',
  '/reviews': 'Reviews',
  '/settings': 'Settings',
}

interface AppLayoutProps {
  children: ReactNode
}

/** Visual application chrome. DeepSpace providers and route nesting stay outside this component. */
export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const title = pageTitles[location.pathname] ?? 'PRInspect'

  return (
    <div className="min-h-screen bg-[#090b0f] text-slate-100 lg:flex">
      {mobileNavOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <Sidebar open={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      <div className="min-w-0 flex-1 lg:pl-[260px]">
        <Header title={title} onMenuClick={() => setMobileNavOpen((open) => !open)} />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  )
}
