import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const baseRevision = core.getInput('base_revision')
    if (!baseRevision) {
      throw new Error('base_revision is required!')
    }
    core.debug(`Base revision: ${baseRevision}`)

    const headRevision = core.getInput('head_revision') || github.context.sha
    core.debug(`Head revision: ${headRevision}`)

    const headOnlyCommitsCount = await getNumberOrCommits(
      baseRevision,
      headRevision
    )

    const baseOnlyCommitsCount = await getNumberOrCommits(
      headRevision,
      baseRevision
    )

    const {repository} = await queryCommitsAndPrs(
      headRevision,
      baseRevision,
      headOnlyCommitsCount,
      baseOnlyCommitsCount
    )

    const {commits: headOnlyCommits, pullRequests: headOnlyPullRequests} =
      parseCommitHistoryFragment(repository.headOnlyCommits)
    const {commits: baseOnlyCommits, pullRequests: baseOnlyPullRequests} =
      parseCommitHistoryFragment(repository.baseOnlyCommits)

    core.setCommandEcho(true)
    core.setOutput('result', {
      headOnlyCommits,
      headOnlyPullRequests,
      baseOnlyCommits,
      baseOnlyPullRequests
    })
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message)
      core.setFailed(error.message)
    }
  }
}

run()

async function getNumberOrCommits(base: string, head: string): Promise<number> {
  let count = 0
  try {
    await exec.exec('git', ['log', '--oneline', `${base}..${head}`], {
      silent: true,
      cwd: '../react',
      listeners: {
        stdline() {
          count++
        }
      }
    })
  } catch (error) {
    core.warning(
      `Revision not found${error instanceof Error ? `: ${error.message}` : ''}`
    )
    return 0
  }
  return count
}

async function queryCommitsAndPrs(
  headCommit: string,
  baseCommit: string,
  numberOfNewCommits: number,
  numberOfRemovedCommits: number
): Promise<QueryResult> {
  const octokit = github.getOctokit(core.getInput('github_token'))
  const queryParams = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    headCommit,
    baseCommit,
    numberOfNewCommits: Math.min(100, numberOfNewCommits),
    numberOfRemovedCommits: Math.min(100, numberOfRemovedCommits)
  }
  core.debug(`queryParams: ${JSON.stringify(queryParams)}`)
  const result = await octokit.graphql<QueryResult>(QUERY, queryParams)
  core.debug(JSON.stringify(result))
  return result
}

function parseCommitHistoryFragment(fragment: null | CommitHistoryFragment): {
  commits: CommitDetails[]
  pullRequests: PullRequestDetails[]
} {
  if (!fragment) {
    return {commits: [], pullRequests: []}
  }
  const commits = fragment.history.edges.map(({node}) => ({
    ...node,
    associatedPullRequests: node.associatedPullRequests.nodes.map(pr => ({
      ...pr,
      labels: pr.labels.nodes.map(label => label.name),
      author: pr.author.login
    }))
  }))

  const pullRequests = uniqeBy(
    commits.flatMap(commit => commit.associatedPullRequests),
    pr => pr.number
  )

  return {commits, pullRequests}
}

interface PullRequestDetails {
  number: number
  title: string
  url: string
  labels: string[]
  body: string
  closed: boolean
  merged: boolean
  isDraft: boolean
  createdAt: string
  author: string
}

interface CommitDetails {
  oid: string
  abbreviatedOid: string
  messageHeadline: string
  message: string
  url: string
  associatedPullRequests: PullRequestDetails[]
}

interface QueryResult {
  repository: Record<
    'headOnlyCommits' | 'baseOnlyCommits',
    null | CommitHistoryFragment
  >
}
interface CommitHistoryFragment {
  history: {
    edges: {
      node: {
        oid: string
        abbreviatedOid: string
        messageHeadline: string
        message: string
        url: string
        associatedPullRequests: {
          nodes: {
            number: number
            title: string
            url: string
            labels: {
              nodes: {
                name: string
              }[]
            }
            body: string
            closed: boolean
            merged: boolean
            isDraft: boolean
            createdAt: string
            author: {
              login: string
            }
          }[]
        }
      }
    }[]
  }
}

const QUERY = `
query getPullRequests($repo: String!, $owner: String!, $headCommit: String = "", $numberOfNewCommits: Int = 0, $baseCommit: String = "", $numberOfRemovedCommits: Int = 0) {
  repository(name: $repo, owner: $owner) {
    headOnlyCommits: object(expression: $headCommit) {
      ... on Commit {
        history(first: $numberOfNewCommits) {
          ...commitHistoryFields
        }
      }
    }
    baseOnlyCommits: object(expression: $baseCommit) {
      ... on Commit {
        history(first: $numberOfRemovedCommits) {
          ...commitHistoryFields
        }
      }
    }
  }
}

fragment commitHistoryFields on CommitHistoryConnection {
  edges {
    node {
      oid
      abbreviatedOid
      messageHeadline
      message
      url
      associatedPullRequests(first: 50) {
        nodes {
          number
          title
          url
          labels(first: 50) {
            nodes {
              name
            }
          }
          body
          closed
          merged
          isDraft
          createdAt
          author {
            login
          }
        }
      }
    }
  }
}
`

function uniqeBy<T>(arr: T[], keySelector: (item: T) => unknown): T[] {
  const keySet = new Set()
  return arr.filter(item => {
    const key = keySelector(item)
    if (keySet.has(key)) {
      return false
    }
    keySet.add(key)
    return true
  })
}
