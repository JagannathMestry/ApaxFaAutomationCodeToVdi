const { app } = require('@azure/functions');

app.http('fetchPayeeDetails', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const baseUrl1 = `/payees/code/`;
      const baseUrl2 = `/payees/code/`;
      const baseUrl3 = `/payees/`;
      const additionalFunctionUrl = 'https://asd.azurewebsites.net/api/';

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
          jsonBody: { error: 'Missing required query parameter: payeecodes' }
        };
      }

      let additionalDataArray = [];
      try {
        const additionalRes = await fetch(`${additionalFunctionUrl}?payeecodes=${payeecodes.join(',')}`, {
          method: 'GET'
        });

        if (!additionalRes.ok) {
          throw new Error(`Additional API failed with status ${additionalRes.status}`);
        }

        additionalDataArray = await additionalRes.json();
      } catch (error) {
        return {
          status: 500,
          jsonBody: { error: 'Failed to fetch from additional API', detail: error.message }
        };
      }

      let successCount = 0;
      const results = await Promise.all(
        payeecodes.map(async (code) => {
          try {
            const [res1, res2, res3] = await Promise.all([
              fetch(`${baseUrl1}${code}`, { method: 'GET', headers }),
              fetch(`${baseUrl2}${code}/ssi`, { method: 'GET', headers }),
              fetch(`${baseUrl3}${code}/attributes`, { method: 'GET', headers })
            ]);

            if (!res1.ok || !res2.ok || !res3.ok) {
              return [{
                PayeeCode: code,
                error: `Error fetching data for ${code} (statuses: ${res1.status}, ${res2.status}, ${res3.status})`
              }];
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
                  ...data1,
                  ...owner,
                  PayeeAttributeFieldValue: attributeData?.PayeeAttributeFieldValue,
                  PayeeAttributeFieldId: attributeData?.PayeeAttributeField?.PayeeAttributeFieldId,
                  PayeeAttributeFieldCode: attributeData?.PayeeAttributeField?.PayeeAttributeFieldCode,
                  Status: additionalMatch?.Status
                };
              });

            const filtered = mergedData
              .filter(item =>
                !currencyCodeFilter ||
                currencyCodeFilter.includes(item.Currency?.currencyCode?.toUpperCase())
              )
              .map(item => ({
                PayeeCode: item.PayeeCode,
                PayeeId: item.PayeeId,
                PayeeName: item.PayeeDescription?.Name
              }));

            if (filtered.length === 0) {
              return [{
                PayeeCode: code,
                error: `No matching currency found for ${code}`
              }];
            }

            successCount++;
            return filtered;

          } catch (err) {
            return [{
              PayeeCode: code,
              error: `Unexpected error for ${code}: ${err.message}`
            }];
          }
        })
      );

      const flatResults = results.flat();
      let finalStatus = 200;

      if (successCount === 0) {
        finalStatus = 404;
      } else if (successCount < payeecodes.length) {
        finalStatus = 207;
      }

      return {
        status: finalStatus,
        jsonBody: flatResults
      };

    } catch (err) {
      return {
        status: 500,
        jsonBody: { error: 'Internal Server Error', detail: err.message }
      };
    }
  }
});
