const axios = require('axios');
const multipart = require('parse-multipart-data');
const qs = require('qs');
const { getEmail, isMember, saveMark, getMarks } = require('../database');
const { setJson, setErrorJson } = require('../contextHelper');

module.exports = async function (context, req) {
    const email = getEmail(req);
    console.log(email);

    if (!(await isMember(email, context))) {
        setJson(context, { NotMember: 0 });
        return;
    }

    const bodyBuffer = Buffer.from(req.body);
    const boundary = multipart.getBoundary(req.headers['content-type']);
    const parts = multipart.parse(bodyBuffer, boundary);
    const filter = parts.filter((r) => r.name === 'filter')[0].data.toString().trim();

    if (!filter) {
        const marks = await getMarks(email);
        setJson(context, marks);
        return;
    }

    try {
        const getApikeyUrl = `${process.env.getApikeyUrl}&email=${encodeURIComponent(email)}&course=${encodeURIComponent(process.env.course)}`;
        const apiResponse = await axios.get(getApikeyUrl, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const { appId, displayName, password, tenant } = apiResponse.data;
        const credentials = {
            appId,
            displayName,
            password,
            tenant,
        };

        const data = {
            credentials: JSON.stringify(credentials),
            filter,
        };

        const url = `${process.env.graderFunctionUrl}&trace=${encodeURIComponent(email)}`;
        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            data: qs.stringify(data),
            url,
            timeout: 180000,
        };

        console.log(email);
        const res = await axios(options);
        console.log(res.data);

        // loop res.data and save marks
        for (const [key, value] of Object.entries(res.data)) {
            await saveMark(email, key, value);
        }

        setJson(context, res.data);
    } catch (error) {
        context.log(error);
        setErrorJson(context, error);
    }
};