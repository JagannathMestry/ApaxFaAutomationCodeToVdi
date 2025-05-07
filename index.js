const { app } = require('@azure/functions');
const fetch = require('node-fetch'); // Ensure you have this installed

const API_URL = 'https://your-api-url.com/endpoint'; // Replace with actual API URL

app.http('FilterPayeeStatus', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (req, context) => {
        const payeecode = req.query.get('payeecode');
        const status = req.query.get('status'); // Optional

        if (!payeecode) {
            return {
                status: 400,
                jsonBody: { error: 'Missing required query parameter: payeecode' }
            };
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_TOKEN' // Optional
                },
                body: JSON.stringify({}) // Add request body here if needed
            });

            const data = await response.json();

            if (!Array.isArray(data)) {
                return {
                    status: 500,
                    jsonBody: { error: 'Unexpected response format from API' }
                };
            }

            // Filter by payeecode (case-insensitive match)
            let filtered = data.filter(item =>
                item.payeecode?.toLowerCase() === payeecode.toLowerCase()
            );

            // Optionally filter by status
            if (status) {
                filtered = filtered.filter(item =>
                    item.status?.toLowerCase() === status.toLowerCase()
                );
            }

            return {
                status: 200,
                jsonBody: filtered
            };
        } catch (error) {
            return {
                status: 500,
                jsonBody: { error: `API call failed: ${error.message}` }
            };
        }
    }
});
