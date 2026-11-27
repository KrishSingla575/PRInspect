import { Link as LinkIcon, Plus } from "lucide-react";

export type ParsedRepositoryUrl = {
  url: string;
  owner: string;
  name: string;
};

type AddRepositoryProps = {
  connected: boolean;
  connecting?: boolean;
  availableRepositories?: Array<{ githubRepositoryId: string; fullName: string; description?: string | null; selected: boolean; visibility?: string }>;
  addingRepositoryId?: string | null;
  error?: string | null;
  onConnect: () => void;
  onAddRepository: (repositoryId: string) => void;
};

export function parseGitHubRepositoryUrl(value: string): ParsedRepositoryUrl | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com" || url.username || url.password || url.search || url.hash) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 2) return null;
    const [owner, rawName] = segments;
    const name = rawName.replace(/\.git$/i, "");
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(name) || name === "." || name === "..") return null;
    return { url: `https://github.com/${owner}/${name}`, owner, name };
  } catch {
    return null;
  }
}

export default function AddRepository({ connected, connecting = false, availableRepositories = [], addingRepositoryId, error, onConnect, onAddRepository }: AddRepositoryProps) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#10141b] p-4 sm:p-5" aria-labelledby="add-repository-title">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-300"><LinkIcon size={16} /></span>
        <div>
          <h2 id="add-repository-title" className="text-sm font-semibold text-slate-100">Add a repository</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Authorize the PRInspect GitHub App, then select repositories installed with read-only access.</p>
        </div>
      </div>
      {!connected ? <button type="button" onClick={onConnect} disabled={connecting} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60">
        <LinkIcon size={15} /> {connecting ? 'Starting GitHub…' : 'Connect GitHub'}
      </button> : availableRepositories.length ? <ul className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.07]">
        {availableRepositories.map((repository) => <li key={repository.githubRepositoryId} className="flex items-center justify-between gap-3 px-3 py-3">
          <span className="min-w-0"><span className="block truncate text-sm text-slate-200">{repository.fullName}</span>{repository.description && <span className="mt-1 block truncate text-xs text-slate-500">{repository.description}</span>}</span>
          <button type="button" onClick={() => onAddRepository(repository.githubRepositoryId)} disabled={repository.selected || addingRepositoryId === repository.githubRepositoryId} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.10] px-3 text-xs font-medium text-slate-200 hover:bg-white/[0.04] disabled:cursor-default disabled:text-slate-500">
            <Plus size={13} /> {repository.selected ? 'Added' : addingRepositoryId === repository.githubRepositoryId ? 'Adding…' : 'Add'}
          </button>
        </li>)}
      </ul> : <p className="text-xs text-slate-500">No repositories are available to this installation.</p>}
      {error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
    </section>
  );
}
