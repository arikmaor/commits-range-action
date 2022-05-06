import {wait} from '../src/wait'
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test} from '@jest/globals'

test('test runs', () => {
  process.env['GITHUB_REPOSITORY'] = 'arikmaor/commits-range-action'
  process.env['INPUT_BASE_REVISION'] = 'HEAD^^^'
  process.env['INPUT_HEAD_REVISION'] = 'HEAD'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
})
