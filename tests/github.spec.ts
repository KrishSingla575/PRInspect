import { expect, loadAllTestAccounts, test } from 'deepspace/testing'

const usableTestAccounts = loadAllTestAccounts().length
test.skip(
  usableTestAccounts < 1,
  'Needs one usable DeepSpace test account. Create one with `npx deepspace test accounts create --email <name>@deepspace.test --name "<name>" --password-stdin`.',
)

test('repository selection and pull request review UI use the GitHub API contracts', async ({ users }) => {
  const [user] = await users(1)
  let selected = false
  const repository = {
    recordId: 'ghr_test',
    data: {
      githubRepositoryId: '123', owner: 'octo', name: 'prinspect', fullName: 'octo/prinspect',
      htmlUrl: 'https://github.com/octo/prinspect', description: 'Review project', defaultBranch: 'main', selected: true,
    },
  }
  const pullRequest = {
    recordId: 'ghp_test',
    data: {
      repositoryId: 'ghr_test', githubPullRequestId: '456', number: 7, title: 'Add review panel',
      description: 'Please inspect this change.', author: 'octo-user', state: 'open',
      sourceBranch: 'feature/review', targetBranch: 'main', htmlUrl: 'https://github.com/octo/prinspect/pull/7',
      updatedAt: '2026-01-02T03:04:05Z',
    },
  }

  await user.page.route('**/api/github/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const method = request.method()
    if (path === '/api/github/connection') {
      await route.fulfill({ json: { connected: true, account: { accountLogin: 'octo', accountType: 'User' } } })
    } else if (path === '/api/github/repositories/available') {
      await route.fulfill({ json: { repositories: [{ githubRepositoryId: '123', fullName: 'octo/prinspect', description: 'Review project', selected }] } })
    } else if (path === '/api/github/repositories' && method === 'GET') {
      await route.fulfill({ json: { repositories: selected ? [repository] : [] } })
    } else if (path === '/api/github/repositories' && method === 'POST') {
      selected = true
      await route.fulfill({ status: 201, json: { repository } })
    } else if (path === '/api/github/repositories/ghr_test/pull-requests') {
      await route.fulfill({ json: { pullRequests: [pullRequest], page: 1, perPage: 50 } })
    } else if (path === '/api/github/pull-requests/ghp_test') {
      await route.fulfill({ json: { pullRequest } })
    } else if (path === '/api/github/pull-requests/ghp_test/files') {
      await route.fulfill({ json: { files: [{ filename: 'src/review.ts', status: 'modified', additions: 2, deletions: 1, changes: 3, patch: '@@ -1 +1,2 @@' }] } })
    } else if (path === '/api/github/pull-requests/ghp_test/diff') {
      await route.fulfill({ json: { diff: 'diff --git a/src/review.ts b/src/review.ts\n+safe rendered diff' } })
    } else {
      await route.fulfill({ status: 404, json: { error: `Unexpected GitHub API request: ${method} ${path}` } })
    }
  })

  await user.page.goto('/repositories')
  await expect(user.page.getByText('octo/prinspect')).toBeVisible()
  await user.page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(user.page.getByRole('button', { name: 'Added' })).toBeVisible()
  await expect(user.page.getByText('No repositories selected')).toHaveCount(0)

  await user.page.goto('/reviews')
  await user.page.getByRole('button', { name: /Add review panel/ }).click()
  await expect(user.page.getByRole('heading', { name: 'Add review panel' })).toBeVisible()
  await expect(user.page.getByText('src/review.ts')).toBeVisible()
  await expect(user.page.getByText('safe rendered diff')).toBeVisible()
})
