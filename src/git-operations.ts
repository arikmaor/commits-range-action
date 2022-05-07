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
