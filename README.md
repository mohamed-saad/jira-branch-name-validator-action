# JIRA Branch Name Validation Action

A GitHub action for ensuring that the branch name contains a valid JIRA id (as format) and whether the same JIRA id is contained in the PR title and commit message(s).

The same code is npm-packaged and used for local pre-commit validation of the branch name, only (via git hooks / husky). The PR title and commits are not checked locally because they are not relevant at this step in the workflow (PR doesn't have to exist when still developing locally and local commit messages can be whatever the developer wants - i.e. before squash and push).

## Inputs

### `branch-name`

**Required** The name of the branch to validate against.

### `pr-title`

**Required** The title of the PR to validate.

### `commits`

**Required** The GitHub API response JSON containing the commits of the PR.

### `prefix`

**Optional** The Jira project prefix (default is `JIRA`).

***

### `conventional-check`

**Optional** Enable conventional checks on branch name (default is `no`).

***

## Example usage

```
uses: worksome/jira-branch-name-validator-action@main
with:
  branch-name: $BRANCH_NAME
```

## Full example usage

```
name: Code Analysis

on:
  pull_request

jobs:
  branchName:
    name: Branch Validation
    runs-on: ubuntu-latest
    steps:

      - uses: octokit/request-action@v2.x
        id: get_pr_commits
        with:
          route: GET /repos/{owner}/{repo}/pulls/{pull_number}/commits
          owner: worksome
          repo: platform
          pull_number: ${{ github.event.pull_request.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Validate JIRA branch name and PR/commit consistency
        uses: worksome/jira-branch-name-validator-action@v2.0.0
        with:
          branch-name: ${{ github.event.pull_request.head.ref }}
          pr-title: ${{ github.event.pull_request.title }}
          commits: ${{ steps.get_pr_commits.outputs.data }}
          prefix: JIRA

```

## Setting up for action development
```
npm i -g @vercel/ncc
```

## Building and releasing the action

```
npm run build
```

The resulting (generated) code requires pushing to GitHub, after which a new release can be drafted with this new code as source. Once the PR is merged, a new release off main branch can be drafted with a major.minor.patch version. A release off the PR branch can be drafted with a major.minor.patch-rcnumber version or similar. To use the new action functionality on GitHub, the action needs to be published on the GitHub Marketplace (during release drafting).

## Setting up for hook deployment

Access to Worksome npm registry is required. Ask about it in `#devtalk`.
New versions of the package should be published to the npm registry, trying to maintain version consistency between the npm package and the GitHub action release version. 

## Testing

The GitHub action requires the new version to be pushed to PR branch and a new release to be drafted (and published to GitHub marketplace). After that, update the version of the GitHub action as used in the "client" repository (as well as any other changes it might require, e.g. add newly introduced parameters to the module) and push and test (by triggering the relevant events, whenever possible).

The local branch validator can be manually triggered on repositories that use the module (requires publish of the new package to worksome registry or [locally](https://medium.com/@debshish.pal/publish-a-npm-package-locally-for-testing-9a00015eb9fd)). To do this, use the following command:

```shell
node_modules/.bin/branch-validator
```

## Conventional Commits Checks

If you want to ensure your branch name matches the [Conventional Commits spec](https://www.conventionalcommits.org/). The full list of the valid type names is defined here [Conventional Commit Types](https://github.com/commitizen/conventional-commit-types). With this feature activated, a branch must start with one of these types as in the example below:

```
feat/JIRA-123: Add `Button` component.
^    ^         ^
|    |         |__ Subject
|    |____________ Jira ID
|_________________ Type
```


## Outputs

In case the validation fails, this action will populate the `error_message` ouput.

[An output can be used in other steps](https://docs.github.com/en/actions/using-jobs/defining-outputs-for-jobs), for example to comment the error message onto the pull request.

<details>
<summary>Example</summary>

```yml
name: "Code Analysis"

on:
  pull_request_target:
    types:
      - opened
      - edited
      - synchronize

jobs:
  main:
    name: Validate PR title
    runs-on: ubuntu-latest
    steps:
      - uses: octokit/request-action@v2.x
        id: get_pr_commits
        with:
          route: GET /repos/{owner}/{repo}/pulls/{pull_number}/commits
          owner: worksome
          repo: platform
          pull_number: ${{ github.event.pull_request.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Validate JIRA branch name and PR/commit consistency
        uses: worksome/jira-branch-name-validator-action@v2.0.0
        id: validate_pr_commits        
        with:
          branch-name: ${{ github.event.pull_request.head.ref }}
          pr-title: ${{ github.event.pull_request.title }}
          commits: ${{ steps.get_pr_commits.outputs.data }}
          prefix: JIRA

      - uses: marocchino/sticky-pull-request-comment@v2
        # When the previous steps fails, the workflow would stop. By adding this
        # condition you can continue the execution with the populated error message.
        if: always() && (steps.validate_pr_commits.outputs.error_message != null)
        with:
          header: pr-commits-lint-error
          message: |
            Hey there and thank you for opening this pull request! 👋🏼
            
            We require branch names and commit messages to be linked with the Jira-ID for your PR.

            Details:
            
            ```
            ${{ steps.validate_pr_commits.outputs.error_message }}
            ```

      # Delete a previous comment when the issue has been resolved
      - if: ${{ steps.validate_pr_commits.outputs.error_message == null }}
        uses: marocchino/sticky-pull-request-comment@v2
        with:   
          header: pr-commits-lint-error
          delete: true
```

</details>