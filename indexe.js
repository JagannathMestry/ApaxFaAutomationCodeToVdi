const { app } = require('@azure/functions');

app.http('MySecondFunction', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        return {
            status: 200,
            body: "This is the second function!"
        };
    }
});
