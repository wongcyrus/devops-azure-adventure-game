const { TableClient } = require('@azure/data-tables');

const { storageAccountConnectionString } = process.env;
const usersTableClient = TableClient.fromConnectionString(storageAccountConnectionString, 'users');
const marksTableClient = TableClient.fromConnectionString(storageAccountConnectionString, 'marks');

const getEmail = (req) => {
    const header = req.headers['x-ms-client-principal'];
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    const { userDetails } = JSON.parse(decoded);
    return userDetails;
};

const isMember = async (email, context) => {
    try {
        const user = await usersTableClient.getEntity(email, email);
        context.log(user);
        return Boolean(user.partitionKey);
    } catch (error) {
        return false;
    }
};

const saveMark = async (email, task, mark) => {
    const isExist = async (email, task) => {
        try {
            const m = await marksTableClient.getEntity(email, task);
            console.log('exist');
            return Boolean(m.partitionKey);
        } catch (error) {
            console.log('Not exist');
            return false;
        }
    };

    if (await isExist(email, task)) {
        const now = new Date();
        const m = await marksTableClient.getEntity(email, task);
        m.mark = mark;
        m.lastTrial = new Date();
        m.trialCourt += 1;
        if (mark !== 0 && !m.passAt) {
            m.passAt = now;
        }
        await marksTableClient.updateEntity(m, 'Merge');
        return;
    }

    console.log('not exist');
    const now = new Date();
    const data = {
        partitionKey: email,
        rowKey: task,
        mark,
        firstTrial: now,
        trialCourt: 1,
        lastTrial: now,
    };
    if (mark !== 0) {
        data.passAt = now;
    }
    await marksTableClient.createEntity(data);
};

const getMarks = async (email) => {
    let continuationToken = null;
    let pageEntities = undefined;
    let entities = [];
    do {
        const page = await marksTableClient
            .listEntities({
                queryOptions: {
                    filter: `PartitionKey eq '${email}'`,
                },
            })
            .byPage({ maxPageSize: 100, continuationToken })
            .next();
        pageEntities = page.value;
        if (!pageEntities) break;
        continuationToken = pageEntities.continuationToken;
        entities = entities.concat(pageEntities);
    } while (continuationToken !== undefined);
    entities = entities.reduce((acc, cur) => {
        acc[cur.rowKey] = cur.mark;
        return acc;
    }, {});
    return entities;
};

module.exports = {
    getEmail,
    isMember,
    saveMark,
    getMarks,
};