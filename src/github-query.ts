import * as core from '@actions/core'
import * as fs from 'fs'
import * as github from '@actions/github'
import * as path from 'path'

const QUERY = fs.readFileSync(path.resolve(__dirname, '../src/query.gql'), {
  encoding: 'utf-8'
})

export async function queryCommitsAndPrs(
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

export interface QueryResult {
  repository: Record<
    'headOnlyCommits' | 'baseOnlyCommits',
    null | CommitHistoryFragment
  >
}
export interface CommitHistoryFragment {
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
