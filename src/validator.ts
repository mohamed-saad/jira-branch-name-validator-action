export default function (branchName: string, prefix: string, conventionalCheck: string): [string, string[]] {

    let result: string[] = []

    if (conventionalCheck == 'yes') {
        let isPresent = false;
        // source: https://github.com/commitizen/conventional-commit-types/blob/master/index.json
        const defaultTypes = ['feat','fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
        for (var key in defaultTypes) {
          let typePrefix = defaultTypes[key]+"/"
          if (branchName.startsWith(typePrefix)) {
            isPresent = true;
            branchName = branchName.substring(typePrefix.length)
            break;
          }
        }
        if (!isPresent) {
            result.push(`Branch doesn't start with valid type. Expected types are ${defaultTypes.join(', ')}`)
        }
    }


    const separator = branchName.indexOf("-");
    if (separator < 0){
        result.push(`Can't extract the Jira project name from the branch name, found this as the branch name "${branchName}".`)
    } else {
        if (prefix.length == 0) {
            prefix = branchName.substring(0, separator)
        }
        branchName = branchName.substring(separator+1)
    }

    let matches: string[] | null = branchName.match(/^\d*/);

    const rawJiraId = matches ? matches[0] : '0'
    const jiraId = parseInt(rawJiraId)

    if (rawJiraId.length == 0) {
        result.push(`Can't recognize the JIRA id in this part of the branch name "${branchName}".`)
    } else {    
        if (isNaN(jiraId) || jiraId === 0) {
            result.push(`JIRA id is not a positive number, found "${rawJiraId}".`)
        }
        if (rawJiraId.length !== jiraId.toString().length) {
            result.push(`JIRA id has leading zeros, found "${rawJiraId}".`)
        }

        branchName = branchName.substring(rawJiraId.length)
        if (!/^[\-_]/.test(branchName)) {
            result.push(`Separator after JIRA id is not \`_\` or \`-\`, looking now into this part "${branchName.substring(0, 1)}" in the branch name.`)
        }
    }


    branchName = branchName.substring(1)
    if (!/^[a-z0-9\-_]+$/.test(branchName)) {
        result.push(`Description after JIRA id should be all in small letters and use hyphen or underscore as word separator, looking now into this part "${branchName}" in the branch name.`)
    }

    if (branchName.length > 100) {
        result.push(`Description after JIRA id has to be shorter than 100 characters, found this as the branch name "${branchName}".`)
    }

    return [`${prefix}-${jiraId}`, result]
}

