import { Bell, Menu, Search, Command } from 'lucide-react'

interface HeaderProps {
  title: string
  onMenuClick: () => void
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-white/[0.07] bg-[#090b0f]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onMenuClick}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
      >
        <Menu size={19} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-600">PRInspect / Workspace</p>
        <h1 className="mt-0.5 truncate text-sm font-semibold text-slate-100">{title}</h1>
      </div>
      <button
        type="button"
        className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-left text-xs text-slate-500 transition hover:border-white/[0.14] hover:text-slate-300 md:flex"
        aria-label="Search (coming soon)"
        disabled
      >
        <Search size={14} />
        <span className="flex-1">Search repositories...</span>
        <span className="flex items-center gap-0.5 rounded border border-white/[0.08] px-1 py-0.5 text-[9px] text-slate-600"><Command size={9} /> K</span>
      </button>
      <button
        type="button"
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
      >
        <Bell size={16} />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-400 ring-2 ring-[#090b0f]" />
      </button>
      <div className="hidden h-8 w-px bg-white/[0.08] sm:block" />
      <div className="hidden items-center gap-2 sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-[10px] font-semibold text-white">PR</span>
        <span className="text-xs font-medium text-slate-300">Developer</span>
      </div>
    </header>
  )
}
