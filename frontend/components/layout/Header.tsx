import { useState } from 'react'
import { AuthOverlay, signOut, useAuthProfileReady } from 'deepspace'
import { Bell, ChevronDown, LogOut, Menu, Search, Command } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu'

interface HeaderProps {
  title: string
  onMenuClick: () => void
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { isLoaded, isSignedIn, user, userLoading } = useAuthProfileReady({ requireUser: true })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const profileReady = !isSignedIn || (!userLoading && !!user)

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
      {!isLoaded ? null : isSignedIn && !profileReady ? (
        <div aria-label="Loading account" className="h-8 w-24 animate-pulse rounded-full bg-white/[0.06]" />
      ) : isSignedIn && user ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Account menu"
                className="group flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2 py-1.5 text-left transition hover:bg-white/[0.06]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-[10px] font-semibold text-white">
                  {(user.name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}
                </span>
                <span
                  data-testid="nav-user-name"
                  className="hidden max-w-32 truncate text-xs font-medium text-slate-300 sm:block"
                >
                  {user.name || user.email}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500 transition-transform group-data-[popup-open]:rotate-180" aria-hidden />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-64 border-white/[0.08] bg-[#10141b] text-slate-100">
            <DropdownMenuLabel>
              <div className="truncate text-xs font-medium text-slate-200">{user.name || 'Signed in'}</div>
              <div data-testid="nav-user-email" className="mt-1 truncate text-xs font-normal text-slate-400">
                {user.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            <DropdownMenuItem onClick={() => signOut()} className="text-slate-300">
              <LogOut aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          type="button"
          data-testid="nav-sign-in-button"
          onClick={() => setShowAuthModal(true)}
          className="rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400"
        >
          Sign in
        </button>
      )}
      {showAuthModal && (
        <AuthOverlay
          providers={['github', 'google']}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </header>
  )
}
