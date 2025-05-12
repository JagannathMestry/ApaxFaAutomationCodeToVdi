const { app } = require('@azure/functions');

app.http('ProcessPayees', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const payeeRecords = await request.json();

    if (!Array.isArray(payeeRecords)) {
      return { status: 400, jsonBody: { error: 'Expected array of payee records' } };
    }

    const patchUrlForPayees = process.env.API1_URL;
    const patchUrlForAccounts = process.env.API2_URL;

    // --- Prepare API 1 Payload: One patch per unique PayeeCode ---
    const seenPayeeCodes = new Set();
    const payeePatchPayload = [];
    let payeeCorrelationId = 1;

    for (const record of payeeRecords) {
      const payeeCode = record.PayeeCode;

      if (!seenPayeeCodes.has(payeeCode)) {
        seenPayeeCodes.add(payeeCode);

        payeePatchPayload.push({
          payeeCode,
          correlation_id: payeeCorrelationId++,
          timestamp: new Date().toISOString()
        });
      }
    }

    // --- Prepare API 2 Payload: One patch per (PayeeCode + CurrencyCode) ---
    const accountPatchPayload = payeeRecords.map((record, index) => ({
      payeeCode: record.PayeeCode,
      currency: record.CurrencyCode,
      bankName: record.BankName,
      sortCode: record.BankSortCode,
      correlation_id: index + 1
    }));

    // --- Send PATCH requests in parallel ---
    const [payeeResponse, accountResponse] = await Promise.all([
      fetch(patchUrlForPayees, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payeePatchPayload)
      }),
      fetch(patchUrlForAccounts, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountPatchPayload)
      })
    ]);

    const payeeApiResult = await payeeResponse.json();
    const accountApiResult = await accountResponse.json();

    return {
      status: 200,
      jsonBody: {
        message: 'Payee and account data processed successfully.',
        payeeApiResponse: payeeApiResult,
        accountApiResponse: accountApiResult
      }
    };
  }
});
