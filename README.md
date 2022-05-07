<p align="center">
  <a href="https://github.com/arikmaor/commits-range-action/actions"><img alt="typescript-action status" src="https://github.com/arikmaor/commits-range-action/workflows/build-test/badge.svg"></a>
</p>

# Commits range action

Gets a list of commits that were added or removed (by running git log internally) along with their related pull requests.

Useful for reporting during deployments which PRs are being deployed and which are rolled-back

### Basic Usage:

Add this action as a step to your project's GitHub Action Workflow file:

```yaml
steps:
  - uses: actions/checkout@v2
    with:
      fetch-depth: 0 # we must specify this to checkout all the branches
  - name: Get deployed revision
    id: get_rev
    run: |
      # get the deployed revision somehow, depends on your deployment
      # export it to a step output
      echo "::set-output name=deployed_rev::$DEPLOYED_REV"
  - uses: arikmaor/commits-range-action@v1
    id: commit_data
    with:
      github_token: ${{ secrets.GITHUB_TOKEN }}
      base_revision: ${{ steps.get_rev.outputs.deployed_rev }}
  - name: Print result
    env:
      RESULT: ${{ steps.commit_data.outputs.result }}
    run: echo $RESULT | jq
```

The result is a json that implements the following interface:

```typescript
interface Result {
  headOnlyCommits: CommitDetails[]
  headOnlyPullRequests: PullRequestDetails[]
  baseOnlyCommits: CommitDetails[]
  baseOnlyPullRequests: PullRequestDetails[]
}

interface CommitDetails {
  oid: string
  abbreviatedOid: string
  messageHeadline: string
  message: string
  url: string
  associatedPullRequests: PullRequestDetails[]
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
```
