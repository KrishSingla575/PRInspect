import { GitPullRequest, GitBranch, Clock3 } from "lucide-react";

export type PullRequest = {
  id: string;
  title: string;
  number: number;
  repository: string;
  author?: string;
  branch?: string;
  updatedAt?: string;
  state?: "open" | "closed" | "merged";
};

type PullRequestListProps = {
  pullRequests: PullRequest[];
  loading?: boolean;
  error?: string | null;
  onSelect?: (pullRequest: PullRequest) => void;
};

export default function PullRequestList({ pullRequests, loading = false, error, onSelect }: PullRequestListProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#10141b]" aria-labelledby="pull-request-list-title">
      <div className="border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <h2 id="pull-request-list-title" className="text-sm font-semibold text-slate-100">Pull requests</h2>
        <p className="mt-1 text-xs text-slate-500">Pull requests available for review.</p>
      </div>
      {loading ? (
        <div role="status" className="space-y-3 p-4 sm:p-5"><span className="sr-only">Loading pull requests</span>{[0, 1, 2].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-lg bg-white/[0.04]" />)}</div>
      ) : error ? (
        <div role="alert" className="px-5 py-10 text-center"><p className="text-sm font-medium text-rose-300">Pull requests could not be loaded</p><p className="mt-2 text-xs leading-5 text-slate-500">{error}</p></div>
      ) : pullRequests.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-11 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-500"><GitPullRequest size={19} /></span>
          <p className="mt-3 text-sm font-medium text-slate-300">No pull requests to show</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">No pull requests are available for this repository yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {pullRequests.map((pullRequest) => {
            const content = <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300"><GitPullRequest size={16} /></span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-medium text-slate-200">{pullRequest.title} <span className="font-normal text-slate-500">#{pullRequest.number}</span></span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>{pullRequest.repository}{pullRequest.author ? ` · ${pullRequest.author}` : ""}</span>
                  {pullRequest.branch && <span className="inline-flex items-center gap-1"><GitBranch size={11} />{pullRequest.branch}</span>}
                  {pullRequest.updatedAt && <span className="inline-flex items-center gap-1"><Clock3 size={11} />{pullRequest.updatedAt}</span>}
                </span>
              </span>
              {pullRequest.state && <span className="shrink-0 rounded-full border border-white/[0.08] px-2 py-1 text-[10px] capitalize text-slate-400">{pullRequest.state}</span>}
            </>;
            return <li key={pullRequest.id} className="p-3 sm:p-4">
              {onSelect ? <button type="button" onClick={() => onSelect(pullRequest)} className="flex w-full min-w-0 items-center gap-3 rounded-lg p-2 text-left transition hover:bg-white/[0.03] sm:gap-4">{content}</button> : <div className="flex min-w-0 items-center gap-3 p-2 sm:gap-4">{content}</div>}
            </li>;
          })}
        </ul>
      )}
    </section>
  );
}
