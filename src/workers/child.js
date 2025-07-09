module.exports = async (job) => {
    //leaving this here since it was referenced in my previous emails
    // check if we've been running too many times and getting killed by the OS/k8s
    if (job.attemptsStarted > job.opts.attempts) {
        console.error(`[Child] [${job.name}] Too many runs. OS is probably killing us. ${job.attemptsStarted} > ${job.opts.attempts}`);
        throw new Error(`[Child] [${job.name}] Too many runs. OS is probably killing us.`);
    }
    else {
        console.log(`[Child] [${job.name}] Started runId ${job.attemptsStarted} of ${job.opts.attempts}`);
    }

    await new Promise((resolve) => {
        setTimeout(() => resolve(), 500);
    })

    // throw an error to fail the child
    //console.log(`[Child] [${job.name}] attempt ${job.attemptsStarted} for`)
    if (job.data.value === 2) {
        throw new Error(`[Child] [${job.name}] The child was failed on purpose`);
    }
    // if (job.data.failTheJob) {
    //     throw new Error(`[Child] [${job.name}] The child was failed on purpose`);
    //     //console.log('[Child] [${job.name}]failed');
    // }
    //console.log(`[Child] [${job.name}] succeeded`);

    return true;
};