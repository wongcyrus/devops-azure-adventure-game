const setJson = ({ res }, body) => {
    res.headers = { 'Content-Type': 'application/json' };
    res.body = body;
};

const setErrorJson = ({ res }, body, statusCode = 401) => {
    if (typeof body === 'string') {
        body = { error: body };
    }
    res.status = statusCode;
    res.headers = { 'Content-Type': 'application/json' };
    res.body = body;
};

module.exports = {
    setJson,
    setErrorJson,
};