import { GitBranch } from "lucide-react";
import AddRepository from "../components/repositories/AddRepository";
import RepositoryCard, { type Repository } from "../components/repositories/RepositoryCard";

// Repository data will be supplied by the backend when database integration lands.
const repositories: Repository[] = [];
const repositoriesLoading = false;
const repositoriesError: string | null = null;

export default function RepositoriesPage() {
  return (
    <div className="space-y-6 sm:space-y-7">
      <header>
        <p className="mb-2 text-xs font-medium text-indigo-300">Source control</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Repositories</h1>
        <p className="mt-2 text-sm text-slate-400">Manage the repositories available for pull request reviews.</p>
      </header>

      <AddRepository />

      <section className="space-y-3" aria-labelledby="connected-repositories-title">
        <div>
          <h2 id="connected-repositories-title" className="text-sm font-semibold text-slate-100">Connected repositories</h2>
          <p className="mt-1 text-xs text-slate-500">Your connected repositories will appear here.</p>
        </div>
        {repositoriesLoading ? <div role="status" className="space-y-3"><span className="sr-only">Loading repositories</span>{[0, 1].map((item) => <div key={item} className="h-[76px] animate-pulse rounded-xl border border-white/[0.07] bg-[#10141b]" />)}</div> : repositoriesError ? (
          <div role="alert" className="rounded-xl border border-rose-400/15 bg-rose-400/[0.04] px-5 py-8 text-center"><p className="text-sm font-medium text-rose-300">Repositories could not be loaded</p><p className="mt-2 text-xs text-slate-500">{repositoriesError}</p></div>
        ) : repositories.length > 0 ? repositories.map((repository) => <RepositoryCard key={repository.id} repository={repository} />) : (
          <div className="flex flex-col items-center rounded-xl border border-white/[0.07] bg-[#10141b] px-5 py-11 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-500"><GitBranch size={19} /></span>
            <h3 className="mt-3 text-sm font-medium text-slate-200">No repositories connected</h3>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">A valid URL can be checked above, but repositories cannot be connected until GitHub integration is available.</p>
          </div>
        )}
      </section>
    </div>
  );
}
