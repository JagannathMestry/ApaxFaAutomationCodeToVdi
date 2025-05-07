const { app } = require('@azure/functions');

const API_URL = 'https://your-api-url.com/endpoint'; 

app.http('FilterAndPostFunction', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (req, context) => {
        const payeecodesParam = req.query.get('payeecodes');
        const status = req.query.get('status'); // Optional

        if (!payeecodesParam) {
            return {
                status: 400,
                jsonBody: { error: 'Missing required query parameter: payeecodes' }
            };
        }

        // Split and clean the comma-separated payeecodes
        const payeecodes = payeecodesParam
            .split(',')
            .map(code => code.trim())
            .filter(Boolean);

        // Build nested JSON payload
        const payload = {
            filter: {
                payees: payeecodes,
                ...(status ? { status } : {}) 
            },
            requestMeta: {
                requestId: context.invocationId,
                timestamp: new Date().toISOString()
            }
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_TOKEN' 
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            return {
                status: response.status,
                jsonBody: data
            };

        } catch (error) {
            return {
                status: 500,
                jsonBody: { error: `POST call failed: ${error.message}` }
            };
        }
    }
});
