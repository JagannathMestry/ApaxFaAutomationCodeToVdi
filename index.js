const { app } = require('@azure/functions');
const fs = require('fs');

app.http('fetchPayeeDetails', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const baseUrl1 = `${process.env.HAZELTREE_BASE_URL}/code/`;
      const baseUrl2 = `${process.env.HAZELTREE_BASE_URL}/code/`;
      const baseUrl3 = `${process.env.HAZELTREE_BASE_URL}/payees/`;
      const additionalFunctionUrl = 'https://xyz.azurewebsites.net/api/checkstatus';

      const token = fs.readFileSync('src/token.txt');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const payeecode = request.query.get('payeecodes');
      const payeecodes = (payeecode || '')
        .split(',')
        .map((code) => String(code.trim()))
        .filter(Boolean);

      const currencyCodeParam = request.query.get('currencycode');
      const currencyCodeFilter = currencyCodeParam
        ? currencyCodeParam.split(',').map((c) => c.trim().toUpperCase())
        : null;

      if (payeecodes.length === 0) {
        return {
          status: 400,
          jsonBody: { error: 'Missing required query parameter: payeecodes' },
        };
      }

      let additionalDataArray = [];
      try {
        const additionalRes = await fetch(
          `${additionalFunctionUrl}?payeecodes=${payeecodes.join(',')}`,
          { method: 'GET' }
        );

        if (additionalRes.status === 401) {
          return {
            status: 401,
            jsonBody: { error: 'Unauthorized to access additional API.' },
          };
        }

        if (!additionalRes.ok) {
          throw new Error(`Additional API failed with status ${additionalRes.status}`);
        }

        additionalDataArray = await additionalRes.json();
      } catch (error) {
        return {
          status: 500,
          jsonBody: { error: 'Failed to fetch from additional API', detail: error.message },
        };
      }

      let successCount = 0;

      const results = await Promise.all(
        payeecodes.map(async (code) => {
          try {
            const [res1, res2, res3] = await Promise.all([
              fetch(`${baseUrl1}${code}`, { method: 'GET', headers }),
              fetch(`${baseUrl2}${code}/ssi`, { method: 'GET', headers }),
              fetch(`${baseUrl3}${code}/attributes`, { method: 'GET', headers }),
            ]);

            // Handle unauthorized
            if ([res1, res2, res3].some((res) => res.status === 401)) {
              return [
                {
                  PayeeCode: code,
                  error: `Unauthorized access while fetching data for ${code}`,
                },
              ];
            }

            // If baseUrl1 fails (critical)
            if (res1.status !== 200) {
              return [
                {
                  PayeeCode: code,
                  TMS_StatusCode: res1.status,
                  error: `Error fetching primary data for ${code} (status: ${res1.status})`,
                },
              ];
            }

            // Gracefully handle res2/res3 if not 500
            let data2 = '';
            let data3 = '';

            if (res2.status === 500) {
              return [
                {
                  PayeeCode: code,
                  error: `Server error while fetching SSI data for ${code}`,
                },
              ];
            } else if (res2.ok) {
              data2 = await res2.json();
            }

            if (res3.status === 500) {
              return [
                {
                  PayeeCode: code,
                  error: `Server error while fetching attribute data for ${code}`,
                },
              ];
            } else if (res3.status === 404) {
              data3 = '';
            } else if (res3.ok) {
              data3 = await res3.json();
            }

            const data1 = await res1.json();

            const attr = typeof data3 === 'string' ? null : data3["0"];
            const attributeData = attr?.Payee?.PayeeId === data1.PayeeId ? attr : null;

            const mergedData = (Array.isArray(data2) ? data2 : [])
              .filter((owner) => owner.Owner.Id === data1.PayeeId)
              .map((owner) => {
                const additionalMatch = additionalDataArray.find(
                  (a) => String(a.PayeeCode) === String(data1.PayeeCode)
                );
                return {
                  ...data1,
                  ...owner,
                };
              });

            const filtered = mergedData
              .filter(
                (item) =>
                  !currencyCodeFilter ||
                  currencyCodeFilter.includes(item.Currency?.currencyCode?.toUpperCase())
              )
              .map((item) => ({
                PayeeCode: item.PayeeCode,
                PayeeId: item.PayeeId,
                PayeeName: item.PayeeDescription.Name,
                CurrencyCode: item.Currency?.currencyCode ?? null,
              }));

            if (filtered.length === 0) {
              return [
                {
                  PayeeCode: code,
                  error: `No matching currency found for ${code}`,
                },
              ];
            }

            successCount++;
            return filtered;
          } catch (err) {
            return [
              {
                PayeeCode: code,
                error: `Unexpected error for ${code}: ${err.message}`,
              },
            ];
          }
        })
      );

      const flatResults = results.flat();
      let finalStatus = 200;

      if (successCount === 0) {
        const allUnauthorized = flatResults.every(
          (r) => r.error && r.error.includes('Unauthorized')
        );
        finalStatus = allUnauthorized ? 401 : 404;
      } else if (successCount < payeecodes.length) {
        finalStatus = 207;
      }

      return {
        status: finalStatus,
        jsonBody: flatResults,
      };
    } catch (err) {
      return {
        status: 500,
        jsonBody: { error: 'Internal Server Error', detail: err.message },
      };
    }
  },
});
