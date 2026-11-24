import { signOut, useUser } from 'deepspace'
import { Bell, KeyRound, LogOut, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'

export default function SettingsPage() {
  const { user } = useUser()

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <section>
        <p className="mb-2 text-xs font-medium text-indigo-300">Workspace preferences</p>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Settings</h2>
        <p className="mt-2 text-sm text-slate-400">Manage your account and review workspace preferences.</p>
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#10141b]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-300"><UserRound size={17} /></span>
          <div><h3 className="text-sm font-semibold text-slate-100">Account</h3><p className="mt-1 text-xs text-slate-500">Your DeepSpace sign-in profile.</p></div>
        </div>
        <dl className="grid gap-5 p-5 sm:grid-cols-2">
          <div><dt className="text-[11px] font-medium uppercase tracking-wide text-slate-600">Name</dt><dd className="mt-2 text-sm text-slate-200">{user?.name ?? 'Not set'}</dd></div>
          <div><dt className="text-[11px] font-medium uppercase tracking-wide text-slate-600">Email</dt><dd className="mt-2 text-sm text-slate-200">{user?.email ?? 'Not set'}</dd></div>
        </dl>
        <div className="border-t border-white/[0.06] px-5 py-4">
          <button type="button" onClick={() => signOut()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.09] px-3 text-xs font-medium text-slate-300 transition hover:border-rose-400/30 hover:bg-rose-400/[0.06] hover:text-rose-200">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#10141b]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300"><Bell size={16} /></span>
          <div><h3 className="text-sm font-semibold text-slate-100">Review preferences</h3><p className="mt-1 text-xs text-slate-500">Controls for review notifications and analysis.</p></div>
        </div>
        <div className="divide-y divide-white/[0.05]">
          <Preference icon={<KeyRound size={15} />} title="Repository access" detail="GitHub authorization will be configured when the integration is added." />
          <Preference icon={<Bell size={15} />} title="Review notifications" detail="Notification preferences will be available after review history is connected." />
        </div>
      </section>
    </div>
  )
}

function Preference({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return <div className="flex items-start gap-3 px-5 py-4"><span className="mt-0.5 text-slate-500">{icon}</span><div><p className="text-xs font-medium text-slate-300">{title}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p></div><span className="ml-auto rounded-md border border-white/[0.07] px-2 py-1 text-[9px] uppercase tracking-wide text-slate-600">Soon</span></div>
}
