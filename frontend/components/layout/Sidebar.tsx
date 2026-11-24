import { NavLink } from 'react-router-dom'
import {
  Activity,
  ChevronDown,
  CircleHelp,
  GitBranch,
  GitPullRequest,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
} from 'lucide-react'

const links = [
  { to: '/home', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/repositories', label: 'Repositories', icon: GitBranch },
  { to: '/reviews', label: 'Reviews', icon: GitPullRequest },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]

interface SidebarProps {
  open: boolean
  onNavigate: () => void
}

export default function Sidebar({ open, onNavigate }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/[0.07] bg-[#0d1016] transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex h-[72px] items-center justify-between border-b border-white/[0.07] px-5">
        <NavLink to="/home" onClick={onNavigate} className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
            <ShieldCheck size={19} strokeWidth={2.2} />
          </span>
          <span>
            <span className="block text-[15px] font-semibold tracking-tight text-white">PRInspect</span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Code review workspace</span>
          </span>
        </NavLink>
        <button
          type="button"
          aria-label="Workspace options"
          className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200"
        >
          <ChevronDown size={15} />
        </button>
      </div>

      <div className="px-3 pt-6">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Workspace</p>
        <nav aria-label="Main navigation" className="space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                  isActive
                    ? 'bg-indigo-500/12 text-indigo-200 ring-1 ring-inset ring-indigo-400/15'
                    : 'text-slate-400 hover:bg-white/[0.045] hover:text-slate-100'
                }`
              }
            >
              <Icon size={17} strokeWidth={1.8} className="shrink-0 opacity-90" />
              <span className="flex-1">{label}</span>
              {label === 'Reviews' && <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-500">0</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-8 px-3">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">System</p>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-slate-500">
          <Activity size={17} strokeWidth={1.8} />
          <span>Review engine</span>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Setup pending
          </span>
        </div>
      </div>

      <div className="mt-auto border-t border-white/[0.07] p-3">
        <a href="mailto:support@prinspect.dev" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] text-slate-500 transition hover:bg-white/[0.045] hover:text-slate-200">
          <CircleHelp size={16} /> Help and feedback
        </a>
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/70 text-[11px] font-semibold text-slate-300">PR</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-slate-200">Personal workspace</span>
            <span className="mt-0.5 block truncate text-[10px] text-slate-500">GitHub not connected</span>
          </span>
          <GitBranch size={14} className="text-slate-600" />
        </div>
      </div>
    </aside>
  )
}
