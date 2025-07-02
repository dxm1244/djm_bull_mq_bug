const config = {
    settings: {
        childCount: process.env.CHILD_COUNT ?? 1,
        childFailCount: process.env.CHILD_FAIL_COUNT ?? 1
    },
    bull: {
        useSandboxedWorker: process.env.USE_SANDBOXED_WORKERS === 'true' ? true : false,
    },
    queues: {
        PARENT_QUEUE: {
            name: 'PARENT_QUEUE',
            type: 'parent',
            workerIsActive: process.env.PARENT_QUEUE === 'true',
            workerCount: process.env.PARENT_QUEUE_COUNT || 1
        },
        CHILD_QUEUE: {
            name: 'CHILD_QUEUE',
            type: 'child',
            workerIsActive: process.env.CHILD_QUEUE === 'true',
            workerCount: process.env.CHILD_QUEUE_COUNT || 1
        }
    },
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: process.env.REDIS_DB || 0,
    }
}

module.exports = config;