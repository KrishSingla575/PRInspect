export type ActivityItem = {
  id: string;
  title: string;
  /** Optional context such as repository and pull request number. */
  description?: string;
  /** Display-ready date or relative time supplied by the caller. */
  date?: string;
  status?: string;
};

export type RecentActivityProps = {
  items: ActivityItem[];
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export default function RecentActivity({
  items,
  title = "Recent activity",
  description = "The latest changes across your workspace.",
  emptyTitle = "Nothing here yet",
  emptyDescription = "Connect a repository to see pull requests and review activity here.",
}: RecentActivityProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#10141b]" aria-label={title}>
      <div className="border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-9 text-center sm:py-11">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-500" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" stroke="currentColor" strokeWidth="1.7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
            </svg>
          </span>
          <p className="mt-3 text-xs font-medium text-slate-300">{emptyTitle}</p>
          <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-500">{emptyDescription}</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
              <div className="min-w-0">
                <p className="break-words text-sm text-slate-200">{item.title}</p>
                {item.description && <p className="mt-1 break-words text-xs text-slate-500">{item.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs">
                {item.date && <time className="text-slate-500">{item.date}</time>}
                {item.status && <span className="text-slate-300">{item.status}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
