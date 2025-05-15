const { app } = require('@azure/functions');

app.http('fetchPayeeDetails', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const baseUrl1 = `/payees/code/`;
      const baseUrl2 = `/payees/code/`;
      const baseUrl3 = `/payees/`;
      const additionalFunctionUrl = 'https://hazeltreebankchangesdevfunctionapp.azurewebsites.net/api/checkpayeestatus';

      const headers = {
        Authorization: 'Bearer 123',
        'Content-Type': 'application/json'
      };

      const payeecode = request.query.get('payeecodes');
      const payeecodes = (payeecode || '')
        .split(',')
        .map(code => code.trim())
        .filter(Boolean);

      const currencyCodeParam = request.query.get('currencycode');
      const currencyCodeFilter = currencyCodeParam
        ? currencyCodeParam.split(',').map(c => c.trim().toUpperCase())
        : null;

      if (payeecodes.length === 0) {
        return {
          status: 400,
          jsonBody: [{ error: 'Missing required query parameter: payeecodes' }]
        };
      }

      // Fetch additional payee status
      let additionalDataArray = [];
      try {
        const additionalRes = await fetch(`${additionalFunctionUrl}?payeecodes=${payeecodes.join(',')}`, {
          method: 'GET'
        });
        additionalDataArray = await additionalRes.json();
      } catch (err) {
        return {
          status: 500,
          jsonBody: [{ error: 'Failed to fetch from checkpayeestatus API' }]
        };
      }

      let allResults = [];

      await Promise.all(
        payeecodes.map(async (code) => {
          try {
            const [res1, res2, res3] = await Promise.all([
              fetch(`${baseUrl1}${code}`, { method: 'GET', headers }),
              fetch(`${baseUrl2}${code}/ssi`, { method: 'GET', headers }),
              fetch(`${baseUrl3}${code}/attributes`, { method: 'GET', headers })
            ]);

            if (!res1.ok || !res2.ok || !res3.ok) {
              allResults.push({
                PayeeCode: code,
                error: `One or more API calls failed`,
                status: [res1.status, res2.status, res3.status]
              });
              return;
            }

            const [data1, data2, data3] = await Promise.all([
              res1.json(),
              res2.json(),
              res3.json()
            ]);

            const attr = data3["0"];
            const attributeData = (attr?.Payee?.PayeeId === data1.PayeeId) ? attr : null;

            const mergedData = data2
              .filter(owner => owner.Owner.Id === data1.PayeeId)
              .map(owner => {
                const additionalMatch = additionalDataArray.find(a => a.PayeeCode === data1.PayeeCode);
                return {
                  PayeeCode: data1.PayeeCode,
                  PayeeId: data1.PayeeId,
                  PayeeName: data1.PayeeDescription?.Name,
                  PayeeAttributeFieldValue: attributeData?.PayeeAttributeFieldValue,
                  PayeeAttributeFieldId: attributeData?.PayeeAttributeField?.PayeeAttributeFieldId,
                  PayeeAttributeFieldCode: attributeData?.PayeeAttributeField?.PayeeAttributeFieldCode,
                  Status: additionalMatch?.Status,
                  Currency: owner.Currency?.currencyCode
                };
              });

            const filtered = mergedData.filter(item =>
              !currencyCodeFilter || currencyCodeFilter.includes(item.Currency?.toUpperCase())
            );

            if (filtered.length === 0) {
              allResults.push({
                PayeeCode: code,
                error: 'No matching currency code or data found'
              });
            } else {
              allResults.push(...filtered.map(({ Currency, ...rest }) => rest)); // drop internal Currency key
            }

          } catch (err) {
            allResults.push({
              PayeeCode: code,
              error: err.message
            });
          }
        })
      );

      // Determine response status
      const hasSuccess = allResults.some(item => !item.error);
      const hasFailure = allResults.some(item => item.error);

      let status = 200;
      if (hasSuccess && hasFailure) {
        status = 207;
      } else if (!hasSuccess && hasFailure) {
        status = 404;
      }

      return {
        status,
        jsonBody: allResults
      };

    } catch (err) {
      return {
        status: 500,
        jsonBody: [{ error: 'Internal server error: ' + err.message }]
      };
    }
  }
});
