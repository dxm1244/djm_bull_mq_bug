module.exports = async (sandboxedJob) => {
    try {
        await new Promise((resolve) => {
            setTimeout(() => resolve(), 1000);
        })

        console.log(`[Parent] is running`);
        return true;
    }
    catch (e) {
        throw e;
    }
};