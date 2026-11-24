import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  GitBranch,
  GitPullRequest,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react'

const metrics = [
  { label: 'Repositories', value: '0', note: 'Connect a repository to begin', icon: GitBranch, color: 'text-indigo-300', wash: 'bg-indigo-400/10' },
  { label: 'Open pull requests', value: '0', note: 'Waiting for GitHub connection', icon: GitPullRequest, color: 'text-sky-300', wash: 'bg-sky-400/10' },
  { label: 'Reviews completed', value: '0', note: 'Your review history will appear here', icon: Sparkles, color: 'text-violet-300', wash: 'bg-violet-400/10' },
  { label: 'Findings', value: '0', note: 'Issues found across reviewed changes', icon: ShieldAlert, color: 'text-amber-300', wash: 'bg-amber-400/10' },
]

const setupSteps = [
  { number: '01', title: 'Connect a GitHub repository', detail: 'Choose a repository you want PRInspect to monitor.', done: false },
  { number: '02', title: 'Choose a pull request', detail: 'Inspect changed files and review context before analysis.', done: false },
  { number: '03', title: 'Run your first review', detail: 'Get focused findings for bugs, security, and quality.', done: false },
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Developer workspace
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Overview</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">A clear view of your repositories, pull requests, and AI-assisted code reviews.</p>
        </div>
        <Link to="/repositories" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 text-xs font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400">
          Connect a repository <ArrowRight size={14} />
        </Link>
      </section>

      <section aria-label="Workspace metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, note, icon: Icon, color, wash }) => (
          <article key={label} className="rounded-xl border border-white/[0.07] bg-[#10141b] p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-400">{label}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${wash} ${color}`}><Icon size={16} /></span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{value}</p>
            <p className="mt-1 text-[11px] text-slate-600">{note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <div className="rounded-xl border border-white/[0.07] bg-[#10141b]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Get started</h3>
              <p className="mt-1 text-xs text-slate-500">Set up your first code review workflow.</p>
            </div>
            <span className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] text-slate-500">0 of 3</span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {setupSteps.map((step) => (
              <div key={step.number} className="flex gap-4 px-5 py-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] font-mono text-[10px] text-slate-500">{step.number}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200">{step.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">{step.detail}</p>
                </div>
                {step.number === '01' && <Link to="/repositories" aria-label="Go to repositories" className="ml-auto self-center rounded-md p-1.5 text-slate-500 hover:bg-white/[0.05] hover:text-white"><ArrowUpRight size={15} /></Link>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/[0.10] via-[#10141b] to-[#10141b] p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-300"><Zap size={17} /></div>
          <h3 className="mt-5 text-sm font-semibold text-white">Reviews that respect your workflow</h3>
          <p className="mt-2 text-xs leading-5 text-slate-400">PRInspect is designed to surface actionable changes while keeping your repositories and review history in one workspace.</p>
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/15 px-3 py-2.5 text-[11px] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> GitHub integration setup is the next step
          </div>
          <Link to="/reviews" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-xs font-medium text-indigo-300 hover:text-indigo-200">Explore reviews <ArrowRight size={13} /></Link>
        </div>
      </section>

      <section className="rounded-xl border border-white/[0.07] bg-[#10141b]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Recent reviews</h3>
            <p className="mt-1 text-xs text-slate-500">Your latest pull request analysis.</p>
          </div>
          <Link to="/reviews" className="text-[11px] font-medium text-slate-400 transition hover:text-white">View all</Link>
        </div>
        <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-500"><GitPullRequest size={18} /></span>
          <p className="mt-3 text-xs font-medium text-slate-300">No reviews yet</p>
          <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-500">Connect a repository to bring your pull requests and review activity into this dashboard.</p>
        </div>
      </section>
    </div>
  )
}
