import { GitBranch, GitPullRequest, LockKeyhole } from "lucide-react";

export type Repository = {
  id: string;
  owner: string;
  name: string;
  url: string;
  visibility?: "public" | "private";
  defaultBranch?: string;
  pullRequestCount?: number;
};

type RepositoryCardProps = {
  repository: Repository;
  onSelect?: (repository: Repository) => void;
};

export default function RepositoryCard({ repository, onSelect }: RepositoryCardProps) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
        <GitBranch size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-100">{repository.owner}/{repository.name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {repository.defaultBranch && <span>Default branch: {repository.defaultBranch}</span>}
          {repository.visibility === "private" && <span className="inline-flex items-center gap-1"><LockKeyhole size={11} /> Private</span>}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.07] px-2.5 py-1.5 text-xs text-slate-400">
        <GitPullRequest size={13} aria-hidden="true" />
        {repository.pullRequestCount ?? 0} PRs
      </span>
    </>
  );

  return onSelect ? (
    <button type="button" onClick={() => onSelect(repository)} className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-[#10141b] p-4 text-left transition hover:border-white/[0.14] sm:gap-4 sm:p-5">
      {content}
    </button>
  ) : (
    <article className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-[#10141b] p-4 sm:gap-4 sm:p-5">
      {content}
    </article>
  );
}
