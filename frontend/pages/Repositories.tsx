import { useCallback, useEffect, useState } from 'react'
import { GitBranch } from 'lucide-react'
import AddRepository from '../components/repositories/AddRepository'
import RepositoryCard, { type Repository } from '../components/repositories/RepositoryCard'
import { apiRequest } from '../services/api'

type RepositoryRecord = { recordId: string; data: Repository & { githubRepositoryId: string; fullName: string; htmlUrl: string; defaultBranch: string; selected: boolean } }
type AvailableRepository = { githubRepositoryId: string; fullName: string; description?: string | null; selected: boolean }

export default function RepositoriesPage() {
  const [connected, setConnected] = useState(false)
  const [repositories, setRepositories] = useState<RepositoryRecord[]>([])
  const [available, setAvailable] = useState<AvailableRepository[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [addingRepositoryId, setAddingRepositoryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const status = await apiRequest<{ connected: boolean }>('/api/github/connection')
      setConnected(status.connected)
      if (status.connected) {
        const [saved, accessible] = await Promise.all([
          apiRequest<{ repositories: RepositoryRecord[] }>('/api/github/repositories'),
          apiRequest<{ repositories: AvailableRepository[] }>('/api/github/repositories/available'),
        ])
        setRepositories(saved.repositories)
        setAvailable(accessible.repositories)
      } else {
        setRepositories([])
        setAvailable([])
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load GitHub repositories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function connect() {
    setConnecting(true)
    setError(null)
    try {
      const result = await apiRequest<{ url: string }>('/api/github/installations/start', { method: 'POST' })
      window.location.assign(result.url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start GitHub authorization')
      setConnecting(false)
    }
  }

  async function addRepository(repositoryId: string) {
    setAddingRepositoryId(repositoryId)
    setError(null)
    try {
      await apiRequest('/api/github/repositories', { method: 'POST', body: JSON.stringify({ githubRepositoryId: repositoryId }) })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add repository')
    } finally {
      setAddingRepositoryId(null)
    }
  }

  async function removeRepository(repository: Repository) {
    try {
      await apiRequest(`/api/github/repositories/${encodeURIComponent(repository.id)}`, { method: 'DELETE' })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove repository')
    }
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      <header>
        <p className="mb-2 text-xs font-medium text-indigo-300">Source control</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Repositories</h1>
        <p className="mt-2 text-sm text-slate-400">Choose repositories the PRInspect GitHub App can read for pull request reviews.</p>
      </header>

      <AddRepository connected={connected} connecting={connecting} availableRepositories={available} addingRepositoryId={addingRepositoryId} error={error} onConnect={() => void connect()} onAddRepository={(id) => void addRepository(id)} />

      <section className="space-y-3" aria-labelledby="connected-repositories-title">
        <div>
          <h2 id="connected-repositories-title" className="text-sm font-semibold text-slate-100">Selected repositories</h2>
          <p className="mt-1 text-xs text-slate-500">Only selected repositories appear in the pull request review workspace.</p>
        </div>
        {loading ? <div role="status" className="space-y-3"><span className="sr-only">Loading repositories</span>{[0, 1].map((item) => <div key={item} className="h-[76px] animate-pulse rounded-xl border border-white/[0.07] bg-[#10141b]" />)}</div> : error && !repositories.length ? (
          <div role="alert" className="rounded-xl border border-rose-400/15 bg-rose-400/[0.04] px-5 py-8 text-center"><p className="text-sm font-medium text-rose-300">Repositories could not be loaded</p><p className="mt-2 text-xs text-slate-500">{error}</p></div>
        ) : repositories.length ? repositories.map(({ recordId, data }) => <RepositoryCard key={recordId} repository={{ id: recordId, owner: data.owner, name: data.name, url: data.htmlUrl, visibility: data.visibility, defaultBranch: data.defaultBranch }} onRemove={(repository) => void removeRepository(repository)} />) : (
          <div className="flex flex-col items-center rounded-xl border border-white/[0.07] bg-[#10141b] px-5 py-11 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-500"><GitBranch size={19} /></span>
            <h3 className="mt-3 text-sm font-medium text-slate-200">No repositories selected</h3>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">Connect GitHub and add repositories above to browse their pull requests.</p>
          </div>
        )}
      </section>
    </div>
  )
}
