const { app } = require('@azure/functions');

const API_URL = 'https://your-api-url.com/endpoint'; 

app.http('PostAndReturnFunction', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (req, context) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_TOKEN' // optional
                },
                body: JSON.stringify({
                    
                })
            });

            const data = await response.json();

            return {
                status: response.status,
                jsonBody: data
            };

        } catch (error) {
            return {
                status: 500,
                jsonBody: { error: `API POST call failed: ${error.message}` }
            };
        }
    }
});
