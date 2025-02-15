export default function (jiraId: string, prTitle: string, commits: string): string[] {
    let result: string[] = []

    if (prTitle.search(jiraId) < 0) {
        result.push(`PR title <${prTitle}> does not contain Jira ID inferred from branch name, ${jiraId}`)
    }

    JSON.parse(commits).filter(c => c.commit.message.search(jiraId) < 0).forEach(c => {
        result.push(`Commit message does not contain Jira ID ${jiraId} inferred from branch name. \n______________________________\n${c.commit.message} \n______________________________`);
    })

    return result
}

