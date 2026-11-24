import { FileCode2 } from "lucide-react";

export type DiffViewerProps = {
  diff?: string;
  loading?: boolean;
  error?: string | null;
  fileName?: string;
};

function lineClass(line: string) {
  if (line.startsWith("+") && !line.startsWith("+++")) return "bg-emerald-500/10 text-emerald-200 before:text-emerald-400";
  if (line.startsWith("-") && !line.startsWith("---")) return "bg-rose-500/10 text-rose-200 before:text-rose-400";
  if (line.startsWith("@@")) return "bg-sky-500/[0.08] text-sky-300";
  return "text-slate-400";
}

export default function DiffViewer({ diff = "", loading = false, error, fileName }: DiffViewerProps) {
  const lines = diff.split("\n");
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0c0f14]" aria-labelledby="diff-viewer-title">
      <div className="flex min-w-0 items-center gap-2 border-b border-white/[0.07] bg-[#10141b] px-4 py-3 sm:px-5">
        <FileCode2 size={15} className="shrink-0 text-slate-500" />
        <h2 id="diff-viewer-title" className="text-xs font-semibold text-slate-200">{fileName ?? "Changes"}</h2>
      </div>
      {loading ? <div role="status" className="space-y-2 p-4"><span className="sr-only">Loading diff</span>{[0, 1, 2, 3].map((item) => <div key={item} className="h-5 animate-pulse rounded bg-white/[0.04]" />)}</div>
        : error ? <div role="alert" className="px-5 py-10 text-center"><p className="text-sm font-medium text-rose-300">Diff could not be loaded</p><p className="mt-2 text-xs text-slate-500">{error}</p></div>
        : !diff ? <div className="px-5 py-10 text-center"><p className="text-sm font-medium text-slate-300">No diff selected</p><p className="mt-1 text-xs text-slate-500">Choose a pull request to view its changes.</p></div>
        : <div className="max-h-[65vh] overflow-auto" tabIndex={0} aria-label="Pull request diff; added lines are green and removed lines are red">
          <pre className="min-w-max py-2 font-mono text-[11px] leading-6 sm:text-xs">{lines.map((line, index) => <span key={index} className={`block whitespace-pre px-3 sm:px-5 ${lineClass(line)}`}><span className="mr-3 inline-block w-8 select-none text-right text-slate-600">{index + 1}</span>{line || " "}</span>)}</pre>
        </div>}
      <div className="flex gap-4 border-t border-white/[0.06] px-4 py-2 text-[10px] text-slate-500 sm:px-5"><span className="text-emerald-300">+ Added</span><span className="text-rose-300">− Removed</span></div>
    </section>
  );
}
