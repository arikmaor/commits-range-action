import * as core from '@actions/core'
import * as exec from '@actions/exec'

export async function getNumberOfCommits(
  base: string,
  head: string
): Promise<number> {
  let count = 0
  try {
    await exec.exec('git', ['log', '--oneline', `${base}..${head}`], {
      silent: true,
      listeners: {
        stdline() {
          count++
        }
      }
    })
  } catch (error) {
    core.warning(
      `Error in 'git log ${base}..${head}' ${
        error instanceof Error ? `: ${error.message}` : ''
      }`
    )
    return 0
  }
  return count
}

export async function revParse(rev: string): Promise<string> {
  let parsedRef = rev
  try {
    await exec.exec('git', ['rev-parse', rev], {
      silent: true,
      listeners: {
        stdline(line) {
          parsedRef = line
        }
      }
    })
  } catch (error) {
    core.warning(
      `Revision '${rev}' not found${
        error instanceof Error ? `: ${error.message}` : ''
      }`
    )
  }
  return parsedRef
}
