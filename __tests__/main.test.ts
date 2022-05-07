import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test} from '@jest/globals'

test('test runs', () => {
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: {
      ...process.env,
      GITHUB_REPOSITORY:
        process.env['GITHUB_REPOSITORY'] || 'arikmaor/commits-range-action',
      INPUT_BASE_REVISION: process.env['INPUT_BASE_REVISION'] || 'HEAD^^^',
      INPUT_HEAD_REVISION: process.env['INPUT_HEAD_REVISION'] || 'HEAD'
    }
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
})
