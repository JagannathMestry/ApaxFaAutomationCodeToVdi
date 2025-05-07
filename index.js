const { app } = require('@azure/functions');
const fetch = require('node-fetch'); // Ensure 'node-fetch' is installed

const PATCH_API_URL = 'https://8ceaa6f6-5df8-4513-8a12-2869ace3d8d1.mock.pstmn.io/payee/patch';

app.http('PayeePatchFunction', {
    methods: ['PATCH'],
    authLevel: 'anonymous', // Adjust the authentication level as needed
    handler: async (req, context) => {
        const payeeCodesParam = req.query.get('payeeCodes') || '';
        const isActive = req.query.get('isActive');

        if (!payeeCodesParam || typeof isActive === 'undefined') {
            return {
                status: 400,
                jsonBody: 'Please provide both "payeeCodes" and "isActive" query parameters.'
            };
        }

        const payeeCodes = payeeCodesParam.split(',').map(code => code.trim());

        // Initialize a counter for _correlationId
        let correlationId = 1;

        const body = payeeCodes.map(code => {
            const requestBody = {
                PayeeCode: code,
                PayeeDescription: {
                    Fields: {
                        IsActive: isActive
                    }
                },
                _correlationId: correlationId // Add _correlationId
            };

            // Increment the correlationId for the next item
            correlationId++;

            return requestBody;
        });

        try {
            const response = await fetch(PATCH_API_URL, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 13'
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            return {
                status: response.status,
                jsonBody: result
            };
        } catch (error) {
            return {
                status: 500,
                jsonBody: `Error sending PATCH request: ${error.message}`
            };
        }
    }
});
