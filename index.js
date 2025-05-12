const { app } = require('@azure/functions');

app.http('PayeeDetailsFunction', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const baseUrl1 = 'https://8ceaa6f6-5df8-4513-8a12-2869ace3d8d1.mock.pstmn.io/sia/';
      const baseUrl2 = 'https://8ceaa6f6-5df8-4513-8a12-2869ace3d8d1.mock.pstmn.io/ssi/';
      const baseUrl3 = 'https://8ceaa6f6-5df8-4513-8a12-2869ace3d8d1.mock.pstmn.io/attribute/';
      const additionalFunctionUrl = 'https://your-azure-fn-endpoint.azurewebsites.net/api/additionalFunction';

      const headers = {
        Authorization: 'Bearer 123',
        'Content-Type': 'application/json'
      };

      const payeecodes = (request.query.get('payeecodes') || '')
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

      // Call the additional Azure Function
      const additionalRes = await fetch(`${additionalFunctionUrl}?payeecodes=${payeecodes.join(',')}`, {
        method: 'GET',
        headers
      });

      const additionalDataArray = await additionalRes.json(); // array of data with PayeeCode

      const results = await Promise.all(
        payeecodes.map(async (code) => {
          const [res1, res2, res3] = await Promise.all([
            fetch(`${baseUrl1}${code}`, { method: 'GET', headers }),
            fetch(`${baseUrl2}${code}`, { method: 'GET', headers }),
            fetch(`${baseUrl3}${code}`, { method: 'GET', headers })
          ]);

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
                ...additionalMatch,
                PayeeAttributeFieldValue: attributeData?.PayeeAttributeFieldValue
              };
            });

          return mergedData
            .filter(item =>
              !currencyCodeFilter ||
              currencyCodeFilter.includes(item.Currency?.currencyCode?.toUpperCase())
            )
            .map(item => ({
              PayeeCode: item.PayeeCode,
              PayeeId: item.PayeeId,
              CurrencyCode: item.Currency?.currencyCode ?? null,
              // Include additional fields if necessary from additionalMatch
            }));
        })
      );

      return {
        status: 200,
        jsonBody: results.flat()
      };
https://.azurewebsites.net/api/?payeecodes=19667
    } catch (err) {
      return {
        status: 500,
        jsonBody: { error: err.message }
      };
    }
  }
});
