const { app } = require('@azure/functions');

app.http('ProcessPayees', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
      const payees = await request.json();

      if (!Array.isArray(payees)) {
        return {
          status: 400,
          jsonBody: { error: 'Request body must be an array of objects.' }
        };
      }

      const api1Url = process.env.API1_URL;
      const api2Url = process.env.API2_URL;

      const payloadApi1 = [];
      const payloadApi2 = [];

      // Build both payloads with correlation_id
      payees.forEach((payee, index) => {
        const correlationId = index + 1;

        payloadApi1.push({
          payeeCode: payee.PayeeCode,
          currency: payee.CurrencyCode,
          correlation_id: correlationId,
          timestamp: new Date().toISOString()
          // Add any additional fields for API 1
        });

        payloadApi2.push({
          bankName: payee.BankName,
          sortCode: payee.BankSortCode,
          correlation_id: correlationId,
          metadata: 'additional data here'
          // Add any additional fields for API 2
        });
      });

      // Make PATCH requests using built-in fetch
      const res1 = await fetch(api1Url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadApi1)
      });

      const res2 = await fetch(api2Url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadApi2)
      });

      const res1Json = await res1.json();
      const res2Json = await res2.json();

      return {
        status: 200,
        jsonBody: {
          message: 'Payees processed successfully in bulk',
          api1Response: res1Json,
          api2Response: res2Json
        }
      };
    } catch (err) {
      context.log.error('Error processing payees:', err);
      return {
        status: 500,
        jsonBody: { error: err.message }
      };
    }
  }
});
