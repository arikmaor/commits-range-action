import * as core from '@actions/core'
import * as github from '@actions/github'
import {getNumberOfCommits} from './git-operations'
import {parseQueryResult} from './parse-query'
import {queryCommitsAndPrs} from './github-query'

async function run(): Promise<void> {
  try {
    const baseRevision = core.getInput('base_revision')
    if (!baseRevision) {
      throw new Error('base_revision is required!')
    }
    core.debug(`Base revision: ${baseRevision}`)

    const headRevision = core.getInput('head_revision') || github.context.sha
    core.debug(`Head revision: ${headRevision}`)

    const headOnlyCommitsCount = await getNumberOfCommits(
      baseRevision,
      headRevision
    )

    const baseOnlyCommitsCount = await getNumberOfCommits(
      headRevision,
      baseRevision
    )

    const queryResult = await queryCommitsAndPrs(
      headRevision,
      baseRevision,
      headOnlyCommitsCount,
      baseOnlyCommitsCount
    )

    const result = parseQueryResult(queryResult)

    core.setCommandEcho(true)
    core.setOutput('result', result)
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message)
      core.setFailed(error.message)
    }
  }
}

run()
