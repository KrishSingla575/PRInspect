import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ExternalLink, Sparkles } from 'lucide-react'
import DiffViewer from '../components/reviews/DiffViewer'
import FindingCard, { type Finding } from '../components/reviews/FindingCard'
import PullRequestList, { type PullRequest } from '../components/reviews/PullRequestList'
import { apiRequest } from '../services/api'

type RepositoryRecord = { recordId: string; data: { owner: string; name: string; fullName?: string } }
type PullRequestRecord = {
  recordId: string
  data: { title: string; number: number; author: string; sourceBranch: string; targetBranch: string; updatedAt?: string; state: 'open' | 'closed' | 'merged'; description?: string | null; htmlUrl: string }
}
type ChangedFile = { filename: string; status: string; additions: number; deletions: number; changes: number; patch?: string }

const findings: Finding[] = []

export default function ReviewsPage() {
  const [repositories, setRepositories] = useState<RepositoryRecord[]>([])
  const [repositoryId, setRepositoryId] = useState('')
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [selectedPullRequest, setSelectedPullRequest] = useState<PullRequest | null>(null)
  const [pullRequestDetail, setPullRequestDetail] = useState<PullRequestRecord | null>(null)
  const [files, setFiles] = useState<ChangedFile[]>([])
  const [diff, setDiff] = useState('')
  const [repositoryLoading, setRepositoryLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  const repository = useMemo(() => repositories.find((item) => item.recordId === repositoryId), [repositories, repositoryId])

  useEffect(() => {
    let active = true
    apiRequest<{ repositories: RepositoryRecord[] }>('/api/github/repositories')
      .then(({ repositories: rows }) => {
        if (!active) return
        setRepositories(rows)
        setRepositoryId(rows[0]?.recordId ?? '')
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load repositories') })
      .finally(() => { if (active) setRepositoryLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setSelectedPullRequest(null)
    setPullRequestDetail(null)
    setFiles([])
    setDiff('')
    if (!repositoryId) { setPullRequests([]); return () => { active = false } }
    setLoading(true)
    setError(null)
    apiRequest<{ pullRequests: PullRequestRecord[] }>(`/api/github/repositories/${encodeURIComponent(repositoryId)}/pull-requests`)
      .then(({ pullRequests: rows }) => {
        if (!active) return
        setPullRequests(rows.map(({ recordId, data }) => ({
          id: recordId,
          title: data.title,
          number: data.number,
          repository: repository?.data.fullName ?? `${repository?.data.owner}/${repository?.data.name}`,
          author: data.author,
          branch: `${data.sourceBranch} → ${data.targetBranch}`,
          updatedAt: data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : undefined,
          state: data.state,
        })))
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load pull requests') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [repositoryId, repository])

  async function selectPullRequest(pr: PullRequest) {
    setSelectedPullRequest(pr)
    setPullRequestDetail(null)
    setFiles([])
    setDiff('')
    setDetailLoading(true)
    setDetailError(null)
    try {
      const [detail, changed, patch] = await Promise.all([
        apiRequest<{ pullRequest: PullRequestRecord }>(`/api/github/pull-requests/${encodeURIComponent(pr.id)}`),
        apiRequest<{ files: ChangedFile[] }>(`/api/github/pull-requests/${encodeURIComponent(pr.id)}/files`),
        apiRequest<{ diff: string }>(`/api/github/pull-requests/${encodeURIComponent(pr.id)}/diff`),
      ])
      setPullRequestDetail(detail.pullRequest)
      setFiles(changed.files)
      setDiff(patch.diff)
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : 'Could not load pull request changes')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium text-indigo-300">Analysis workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Reviews</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Browse pull requests, inspect changed files, and review their diff.</p>
        </div>
        <button type="button" disabled title="AI review is not implemented yet" className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 text-xs font-medium text-slate-500">
          <Sparkles size={14} /> Start a review
        </button>
      </header>

      {repositoryLoading ? <div role="status" className="text-sm text-slate-500">Loading repositories…</div> : repositories.length > 0 && <label className="flex max-w-xl flex-col gap-2 text-xs font-medium text-slate-400">
        Repository
        <select value={repositoryId} onChange={(event) => setRepositoryId(event.target.value)} className="h-10 rounded-lg border border-white/[0.10] bg-[#10141b] px-3 text-sm text-slate-100">
          {repositories.map((item) => <option key={item.recordId} value={item.recordId}>{item.data.fullName ?? `${item.data.owner}/${item.data.name}`}</option>)}
        </select>
      </label>}
      {error && !loading && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      {!repositoryLoading && repositories.length === 0 && <div className="rounded-xl border border-white/[0.07] bg-[#10141b] px-5 py-8 text-sm text-slate-400">Connect GitHub and select a repository to see pull requests.</div>}
      <PullRequestList pullRequests={pullRequests} loading={loading} error={error} onSelect={(pr) => void selectPullRequest(pr)} />

      {selectedPullRequest && <section className="rounded-xl border border-white/[0.07] bg-[#10141b] p-4 sm:p-5" aria-labelledby="selected-pr-title">
        {detailLoading ? <p role="status" className="text-sm text-slate-500">Loading pull request details and diff…</p> : detailError ? <p role="alert" className="text-sm text-rose-300">{detailError}</p> : pullRequestDetail && <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs text-slate-500">{repository?.data.fullName ?? 'Repository'} · #{pullRequestDetail.data.number}</p><h2 id="selected-pr-title" className="mt-1 text-base font-semibold text-slate-100">{pullRequestDetail.data.title}</h2></div>
            <a href={pullRequestDetail.data.htmlUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200">Open on GitHub <ExternalLink size={12} /></a>
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">{pullRequestDetail.data.description || 'No description provided.'}</p>
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <h3 className="text-xs font-semibold text-slate-200">Changed files ({files.length})</h3>
            <ul className="mt-2 divide-y divide-white/[0.05]">
              {files.map((file) => <li key={file.filename} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                <span className="break-all font-mono text-slate-300">{file.filename} <span className="font-sans text-slate-500">· {file.status}</span></span>
                <span className="shrink-0"><span className="text-emerald-300">+{file.additions}</span> <span className="text-rose-300">−{file.deletions}</span></span>
              </li>)}
            </ul>
          </div>
        </>}
      </section>}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <DiffViewer diff={diff} loading={detailLoading} error={detailError} fileName={selectedPullRequest ? `PR #${selectedPullRequest.number} diff` : undefined} />
        <section className="min-w-0 rounded-xl border border-white/[0.07] bg-[#10141b]" aria-labelledby="findings-title">
          <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5"><h2 id="findings-title" className="text-xs font-semibold text-slate-200">Findings</h2><p className="mt-1 text-[11px] text-slate-500">Issues identified in an AI review.</p></div>
          {findings.length > 0 ? <div className="space-y-3 p-3">{findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}</div> : <div className="flex flex-col items-center px-4 py-9 text-center"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-500"><AlertTriangle size={17} /></span><p className="mt-3 text-xs font-medium text-slate-300">No findings to show</p><p className="mt-1 max-w-xs text-[11px] leading-5 text-slate-500">AI review generation is not implemented yet.</p></div>}
        </section>
      </section>
    </div>
  )
}
