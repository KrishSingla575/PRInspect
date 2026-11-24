import type { ActivityItem } from "../components/dashboard/RecentActivity";
import RecentActivity from "../components/dashboard/RecentActivity";
import StatCard from "../components/dashboard/StatCard";

export type DashboardStats = {
  repositories: number;
  pullRequests: number;
  completedReviews: number;
  criticalFindings: number;
};

export type DashboardProps = {
  stats?: Partial<DashboardStats>;
  activity?: ActivityItem[];
};

const emptyStats: DashboardStats = {
  repositories: 0,
  pullRequests: 0,
  completedReviews: 0,
  criticalFindings: 0,
};

export default function Dashboard({ stats = {}, activity = [] }: DashboardProps) {
  const counts = { ...emptyStats, ...stats };

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="mb-2 text-xs font-medium text-indigo-300">Developer workspace</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Overview</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          A clear view of your repositories, pull requests, and code reviews.
        </p>
      </header>

      <section aria-label="Workspace metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Repositories" value={counts.repositories} description="Connected repositories" accentClassName="bg-indigo-400/10 text-indigo-300" />
        <StatCard title="Pull requests" value={counts.pullRequests} description="Tracked pull requests" accentClassName="bg-sky-400/10 text-sky-300" />
        <StatCard title="Completed reviews" value={counts.completedReviews} description="Reviews completed" accentClassName="bg-violet-400/10 text-violet-300" />
        <StatCard title="Critical findings" value={counts.criticalFindings} description="Critical severity findings" accentClassName="bg-amber-400/10 text-amber-300" />
      </section>

      <RecentActivity items={activity} />
    </div>
  );
}
