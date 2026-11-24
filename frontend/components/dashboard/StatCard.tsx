import type { ReactNode } from "react";

export type StatCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon?: ReactNode;
  accentClassName?: string;
};

export default function StatCard({
  title,
  value,
  description,
  icon,
  accentClassName = "bg-slate-800 text-slate-300",
}: StatCardProps) {
  return (
    <article className="min-w-0 rounded-xl border border-white/[0.07] bg-[#10141b] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-slate-400">{title}</p>
        {icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accentClassName}`} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
    </article>
  );
}
