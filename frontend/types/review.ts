/** Frontend-facing shapes for pull request review data. */
export interface ReviewFinding {
  id: string
  title: string
  body: string
  severity: 'info' | 'warning' | 'error'
  path?: string
  line?: number
}

export interface PullRequestReview {
  id: string
  repository: string
  pullRequestNumber: number
  status: 'queued' | 'running' | 'completed' | 'failed'
  findings: ReviewFinding[]
}
