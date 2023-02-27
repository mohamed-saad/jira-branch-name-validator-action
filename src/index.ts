import validateBranchName from './validator';
import checkJiraIdConsistency from './jira-id-consistency-check'
import * as core from '@actions/core';

async function run(): Promise<void> {
    try {
        let branchName = core.getInput('branch-name')
        let prTitle = core.getInput('pr-title')
        let commits = core.getInput('commits')
        let prefix = core.getInput('prefix')
        let conventionalCheck = core.getInput('conventional-check')

        let prValidation = (prTitle.length > 0 && commits.length > 0)

        core.info(`Received the following branch name: ${branchName}.`)
        if (prefix.length > 0) {
            core.info(`The format should be \`${prefix}-123_fixing-bug\`.`)
        }

        let [jiraId, results] = validateBranchName(branchName, prefix, conventionalCheck)

        core.info(`Extracted the following JIRA ID from branch name: ${jiraId}`)

        if (prValidation) {
            core.info(`Received the following PR title: ${prTitle}`)
            core.info('Should contain the same JIRA ID.')
            core.info('Received the following commits information:')

            JSON.parse(commits).forEach(c => {
                core.info(`  ${c.commit.message}`)
            })

            core.info('Commit message(s) should contain the same JIRA ID as above.')

            results = results.concat(checkJiraIdConsistency(jiraId, prTitle, commits))
        } else {
            core.info(`PR title or commits information is missing`)
        }

        let error_message = '';
        results.forEach(message => {
            error_message += message + '\n\n';
            core.setFailed(message)
        })
        if (error_message != '') {
            core.setOutput('error_message', error_message);
        }
    } catch (error: any) {
        core.error(error);

        if (error instanceof Error) {
            core.setFailed(error.message);
            core.setOutput('error_message', error.message);
        }
    }
}

run();
