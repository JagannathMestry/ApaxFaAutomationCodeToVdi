module.exports = async function (context, req) {
    const { Username, Password } = req.body || {};

    if (!Username || !Password) {
        context.res = {
            status: 400,
            body: { error: "Username and Password are required." }
        };
        return;
    }

    const API_URL = 'https://apa-uat-2.hazeltree.com/PublicApi/api/v1/Login/apa';
    const HEADERS = {
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ Username, Password })
        });

        const data = await response.json();

        context.res = {
            status: response.status,
            body: data
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: { error: error.message }
        };
    }
};
