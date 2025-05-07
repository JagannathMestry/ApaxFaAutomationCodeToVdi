const { app } = require('@azure/functions');

app.http('LoginFunction', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const { Username, Password } = await request.json();

        if (!Username || !Password) {
            return {
                status: 400,
                jsonBody: { error: "Username and Password are required." }
            };
        }

        const API_URL = 'https://login.microsoftonline.com/common/oauth2/token'; // Must use HTTPS
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

            return {
                status: response.status,
                jsonBody: data
            };
        } catch (error) {
            return {
                status: 500,
                jsonBody: { error: error.message }
            };
        }
    }
});
