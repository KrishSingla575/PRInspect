import { AlertTriangle, FileCode2 } from "lucide-react";

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type Finding = {
  id: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  file?: string;
  line?: number;
};

const severityClass: Record<FindingSeverity, string> = {
  critical: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  high: "border-orange-400/20 bg-orange-400/10 text-orange-300",
  medium: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  low: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  info: "border-slate-400/20 bg-slate-400/10 text-slate-300",
};

type FindingCardProps = {
  finding: Finding;
  onSelect?: (finding: Finding) => void;
};

export default function FindingCard({ finding, onSelect }: FindingCardProps) {
  const content = <>
    <span className="mt-0.5 shrink-0 text-amber-300"><AlertTriangle size={16} aria-hidden="true" /></span>
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2">
        <span className="break-words text-sm font-medium text-slate-200">{finding.title}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${severityClass[finding.severity]}`}>{finding.severity}</span>
      </span>
      <span className="mt-1.5 block text-xs leading-5 text-slate-400">{finding.description}</span>
      {finding.file && <span className="mt-2 flex flex-wrap items-center gap-x-1 text-[11px] text-slate-500"><FileCode2 size={12} />{finding.file}{finding.line ? <span>:{finding.line}</span> : null}</span>}
    </span>
  </>;

  return onSelect ? <button type="button" onClick={() => onSelect(finding)} className="flex w-full gap-3 rounded-xl border border-white/[0.07] bg-[#10141b] p-4 text-left transition hover:border-white/[0.14]">{content}</button> : <article className="flex gap-3 rounded-xl border border-white/[0.07] bg-[#10141b] p-4">{content}</article>;
}
