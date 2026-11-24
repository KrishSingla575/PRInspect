import { GitPullRequest, ListFilter, Sparkles } from 'lucide-react'

export default function ReviewsPage() {
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium text-indigo-300">Analysis history</p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Reviews</h2>
          <p className="mt-2 text-sm text-slate-400">Track AI-assisted reviews and findings across your pull requests.</p>
        </div>
        <button type="button" disabled className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 text-xs font-medium text-slate-500" title="Connect a repository before starting a review">
          <Sparkles size={14} /> Start a review
        </button>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#10141b] px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400"><ListFilter size={15} /><span>All reviews</span><span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-500">0</span></div>
        <div className="flex gap-2 text-[10px] text-slate-600"><span className="rounded-md border border-white/[0.06] px-2 py-1">Status: all</span><span className="rounded-md border border-white/[0.06] px-2 py-1">Repository: all</span></div>
      </section>

      <section className="rounded-xl border border-white/[0.07] bg-[#10141b]">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-100">Review history</h3>
          <p className="mt-1 text-xs text-slate-500">Completed and in-progress pull request reviews.</p>
        </div>
        <div className="flex flex-col items-center px-5 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-slate-500"><GitPullRequest size={21} /></span>
          <h3 className="mt-4 text-sm font-medium text-slate-200">Your review history is empty</h3>
          <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">Once you connect a repository and run a review, findings and review status will be collected here.</p>
        </div>
      </section>
    </div>
  )
}
