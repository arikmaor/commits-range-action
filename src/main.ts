import * as core from '@actions/core'
import * as github from '@actions/github'
import {getNumberOfCommits, revParse} from './git-operations'
import {parseQueryResult} from './parse-query'
import {queryCommitsAndPrs} from './github-query'

async function run(): Promise<void> {
  try {
    const {baseRevision, headRevision} = await getInputRevisions()

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

async function getInputRevisions(): Promise<{
  baseRevision: string
  headRevision: string
}> {
  const headRevisionInput = core.getInput('head_revision') || github.context.sha
  const headRevision = await revParse(headRevisionInput)
  core.debug(
    `Head revision: ${
      headRevisionInput === headRevision
        ? headRevision
        : `${headRevisionInput} (${headRevision})`
    }`
  )

  const baseRevisionInput = core.getInput('base_revision')
  const baseRevision = baseRevisionInput
    ? await revParse(baseRevisionInput)
    : headRevisionInput
  core.debug(
    `Base revision: ${
      baseRevisionInput === baseRevision
        ? baseRevision
        : `${baseRevisionInput} (${baseRevision})`
    }`
  )

  return {baseRevision, headRevision}
}
