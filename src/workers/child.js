module.exports = async (job) => {
    //leaving this here since it was referenced in my previous emails
    // check if we've been running too many times and getting killed by the OS/k8s
    if (job.attemptsStarted > 2) {
        console.error(`Too many runs. OS is probably killing us. ${job.attemptsStarted} > 2`);
        throw new Error(`Too many runs. OS is probably killing us.`);
    }
    else {
        console.log(`On runId ${job.attemptsStarted} of the allowed 2`);
    }

    console.log(`Child '${job.name}' started`)

    await new Promise((resolve) => {
        setTimeout(() => resolve(), 3000);
    })

    // throw an error to fail the child
    console.log(`Child attempt ${job.attemptsStarted} for '${job.name}'`)
    if(job.data.failTheJob) {
        throw new Error('The child was failed on purpose');
        console.log('Child failed');
    }
    console.log('Child succeeded');

    return true;
};