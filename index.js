const { app } = require('@azure/functions');

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

        const body = payeeCodes.map(code => ({
            PayeeCode: code,
            PayeeDescription: {
                Fields: {
                    IsActive: isActive
                }
            }
        }));

        try {
            const response = await fetch(PATCH_API_URL, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '
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
