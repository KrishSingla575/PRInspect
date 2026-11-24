import { AlertTriangle, Sparkles } from "lucide-react";
import DiffViewer from "../components/reviews/DiffViewer";
import FindingCard, { type Finding } from "../components/reviews/FindingCard";
import PullRequestList from "../components/reviews/PullRequestList";

// Review data will be supplied by the backend; keep the initial UI in an honest empty state.
const pullRequests: Parameters<typeof PullRequestList>[0]["pullRequests"] = [];
const findings: Finding[] = [];

export default function ReviewsPage() {
  return (
    <div className="space-y-6 sm:space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium text-indigo-300">Analysis workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Reviews</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Browse pull requests, inspect changes, and review findings when repository data is connected.</p>
        </div>
        <button type="button" disabled title="Review actions will be available with backend integration" className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 text-xs font-medium text-slate-500">
          <Sparkles size={14} /> Start a review
        </button>
      </header>

      <PullRequestList pullRequests={pullRequests} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <DiffViewer />
        <section className="min-w-0 rounded-xl border border-white/[0.07] bg-[#10141b]" aria-labelledby="findings-title">
          <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
            <h2 id="findings-title" className="text-xs font-semibold text-slate-200">Findings</h2>
            <p className="mt-1 text-[11px] text-slate-500">Issues identified in a review.</p>
          </div>
          {findings.length > 0 ? <div className="space-y-3 p-3">{findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}</div> : (
            <div className="flex flex-col items-center px-4 py-9 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-500"><AlertTriangle size={17} /></span>
              <p className="mt-3 text-xs font-medium text-slate-300">No findings to show</p>
              <p className="mt-1 max-w-xs text-[11px] leading-5 text-slate-500">Select a pull request and run a review to see findings here.</p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
