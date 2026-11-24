import { useState, type FormEvent } from "react";
import { Plus, Link as LinkIcon } from "lucide-react";

export type ParsedRepositoryUrl = {
  url: string;
  owner: string;
  name: string;
};

type AddRepositoryProps = {
  onValidUrl?: (repository: ParsedRepositoryUrl) => void;
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

export default function AddRepository({ onValidUrl }: AddRepositoryProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const repository = parseGitHubRepositoryUrl(value);
    if (!repository) {
      setError("Enter a valid GitHub repository URL, such as https://github.com/owner/repository.");
      return;
    }
    onValidUrl?.(repository);
    setMessage("URL looks good. Repository connection will be available when GitHub integration is added.");
  }

  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#10141b] p-4 sm:p-5" aria-labelledby="add-repository-title">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-300"><LinkIcon size={16} /></span>
        <div>
          <h2 id="add-repository-title" className="text-sm font-semibold text-slate-100">Add a repository</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Enter a GitHub repository URL. This checks the format only; it does not connect to GitHub.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="repository-url">GitHub repository URL</label>
        <input
          id="repository-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://github.com/owner/repository"
          value={value}
          onChange={(event) => { setValue(event.target.value); setError(""); setMessage(""); }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "repository-url-error" : message ? "repository-url-message" : "repository-url-hint"}
          className="h-10 min-w-0 flex-1 rounded-lg border border-white/[0.10] bg-black/20 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/10"
        />
        <button type="submit" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 text-xs font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
          <Plus size={15} /> Check URL
        </button>
      </form>
      {error ? <p id="repository-url-error" role="alert" className="mt-2 text-xs text-rose-300">{error}</p> : message ? <p id="repository-url-message" role="status" className="mt-2 text-xs text-emerald-300">{message}</p> : <p id="repository-url-hint" className="mt-2 text-[11px] text-slate-600">Public and private repository authorization is not available yet.</p>}
    </section>
  );
}
