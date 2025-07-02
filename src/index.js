const path = require('path');
const { WorkerPro, FlowProducerPro } = require('@taskforcesh/bullmq-pro');
const config = require('./config/app.js');
const connection = config.redis;

const getWorkerModule = function(modulePath) {
    if (config.bull.useSandboxedWorker) {
        return path.join(__dirname, modulePath);
    } else {
        return require(modulePath);
    }
};

const workers = {
    //imagery
    'PARENT_QUEUE': getWorkerModule('./workers/parent.js'),
    'CHILD_QUEUE': getWorkerModule('./workers/child.js')
};

async function startWorkers() {
    const workerInstances = [];
    for(const queue of  Object.keys(config.queues)) {
        if (config.queues[queue].workerIsActive) {
                let worker = await startWorker(queue);

                //attach event handlers
                attachWorkerEventHandlers(worker);

                //track instances
                workerInstances.push(worker);
        }
    }

    process.on('SIGTERM', async () => {
        const closePromises = workerInstances.map(w => closeWorker(w));
        await Promise.all(closePromises);
    });
}

async function startWorker(queue) {
    //check if the queue and file exists
    if (!workers[queue])
        throw new Error(`Worker for queue ${queue} not found`);

    return new WorkerPro(config.queues[queue].name, workers[queue], {
        useWorkerThreads: config.bull.useWorkerThreads,
        connection,
        lockDuration: 120000,
        concurrency: 1,
        maxStalledCount: 10,
    });
}

function attachWorkerEventHandlers(worker) {
    worker.on('error', (failedReason) => {
        console.error('Worker failing', failedReason);
    });

    worker.on('ready', () => {
        console.log(`***********  Worker for ${worker.name} is ready Mode:${config.bull.useSandboxedWorker ? 'Sanboxed' : 'Modules'} ***********`);
    });

    worker.on('failed', async (job, error) => {
        // hopefully this is just one per job. Maybe we don't want on the listeners at all.
        console.info(`Heard a 'fail' for worker ${worker.name}. Job on attempt ${job.attemptsStarted} of ${job.opts.attempts}.`);

        if (!job.opts || job.attemptsStarted >= job.opts.attempts) {
            //wait 10 seconds to account for race conditions
            await new Promise((resolve) => {
                setTimeout(() => resolve(), 10000);
            });
            //remove any remaining jobs in the flow
            if(job.parent){
                const flow = new FlowProducerPro({ connection });

                const tree = await flow.getFlow({
                    id:  job.parent.id,
                    queueName: job.parent.queueKey.replace('bull:', ''),
                    maxChildren: 10_000
                });
                await tree.job.removeUnprocessedChildren();
                flow.close();
            }
        }
    });
}

async function submitJobs() {
    const bullmqDefaultOptions = {
        removeOnComplete: 1000, //expect that redis will retain the most recent 1000 completed jobs
        removeOnFail: 1, //expect that redis will retain the most recent 5000 failures
        failParentOnFailure: true
    };

    //usually the jobId is from the database, but we'll use time instead
    const jobId = Date.now();
    
    const childJobDefs = Array(config.settings.childCount).map((value, index) => {
        return {
            name: `CHILD_QUEUE:${jobId}_${index}`,
            opts: {
                attempts: 2,
                backoff: {
                    type: 'exponential',
                    delay: 10000,
                },
                ...bullmqDefaultOptions,
                debounce: {
                    id:`CHILD_QUEUE:${jobId}`,
                    ttl: 50000//ms
                }
            },
            queueName: 'CHILD_QUEUE',
            data: { failTheJob: index < config.settings.childFailCount },
        }
    })

    //define our parent job
    const parentJobDef = {
        name: `PARENT_QUEUE_setup:${jobId}`,
        opts: {
            ...bullmqDefaultOptions,
            debounce: {
                id:`PARENT_QUEUE_setup:${jobId}`,
                ttl: 50000//ms
            }
        },
        queueName: 'PARENT_QUEUE',
        data: {},
        children: childJobDefs
    };

    const flow = new FlowProducerPro({ connection });
    await flow.add(parentJobDef);
}

async function start() {
    await startWorkers();
    await submitJobs();
}

start();