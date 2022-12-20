import {CommitHistoryFragment, QueryResult} from './github-query'
import {uniqeBy} from './helpers'

export function parseQueryResult(
  {repository}: QueryResult,
  includeBody = false
): {
  headOnlyCommits: CommitDetails[]
  headOnlyPullRequests: PullRequestDetails[]
  baseOnlyCommits: CommitDetails[]
  baseOnlyPullRequests: PullRequestDetails[]
} {
  const {commits: headOnlyCommits, pullRequests: headOnlyPullRequests} =
    parseCommitHistoryFragment(repository.headOnlyCommits, includeBody)
  const {commits: baseOnlyCommits, pullRequests: baseOnlyPullRequests} =
    parseCommitHistoryFragment(repository.baseOnlyCommits, includeBody)

  return {
    headOnlyCommits,
    headOnlyPullRequests,
    baseOnlyCommits,
    baseOnlyPullRequests
  }
}

function parseCommitHistoryFragment(
  fragment: null | CommitHistoryFragment,
  includeBody: boolean
): {
  commits: CommitDetails[]
  pullRequests: PullRequestDetails[]
} {
  if (!fragment) {
    return {commits: [], pullRequests: []}
  }
  const commits: CommitDetails[] = fragment.history.edges.map(({node}) => ({
    ...node,
    associatedPullRequests: node.associatedPullRequests.nodes.map(pr => ({
      ...pr,
      labels: pr.labels.nodes.map(label => label.name),
      author: pr.author.login
    }))
  }))

  if (!includeBody) {
    for (const commit of commits) {
      for (const pr of commit.associatedPullRequests) {
        delete pr.body
      }
    }
  }

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
  body?: string
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
