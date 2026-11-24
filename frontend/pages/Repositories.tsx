import { ArrowUpRight, GitBranch, LockKeyhole, Plus, Search } from 'lucide-react'

export default function RepositoriesPage() {
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium text-indigo-300">Source control</p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Repositories</h2>
          <p className="mt-2 text-sm text-slate-400">Manage the GitHub repositories available for pull request reviews.</p>
        </div>
        <button type="button" disabled className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 text-xs font-medium text-slate-500" title="GitHub connection is not available yet">
          <Plus size={15} /> Connect GitHub <span className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[9px] uppercase tracking-wide">Soon</span>
        </button>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-[#10141b] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700/40 text-slate-300"><GitBranch size={17} /></span>
          <div><h3 className="text-xs font-medium text-slate-200">Repository access</h3><p className="mt-1 text-[11px] text-slate-500">GitHub account connection has not been configured.</p></div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-400/15 bg-amber-400/[0.06] px-2.5 py-1 text-[10px] text-amber-300"><LockKeyhole size={11} /> Not connected</span>
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#10141b]">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-sm font-semibold text-slate-100">Connected repositories</h3><p className="mt-1 text-xs text-slate-500">Repositories you authorize will appear here.</p></div>
          <label className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.07] bg-black/10 px-3 text-slate-500 sm:w-56">
            <Search size={14} /><input disabled aria-label="Search repositories" placeholder="Search repositories" className="w-full bg-transparent text-xs outline-none placeholder:text-slate-600" />
          </label>
        </div>
        <div className="flex flex-col items-center px-5 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-slate-500"><GitBranch size={21} /></span>
          <h3 className="mt-4 text-sm font-medium text-slate-200">No repositories connected</h3>
          <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">Connect GitHub to select repositories, browse open pull requests, and start reviews. Repository authorization will be handled securely through the backend.</p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] text-slate-600">GitHub integration is coming next <ArrowUpRight size={12} /></span>
        </div>
      </section>
    </div>
  )
}
