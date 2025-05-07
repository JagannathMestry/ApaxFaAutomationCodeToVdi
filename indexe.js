const { app } = require('@azure/functions');

app.http('PayeeDetailsFunction', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const baseUrl1 = 'https://8ceaa6f6-5df8-4513-8a12-2869ace3d8d1.mock.pstmn.io/sia/';
      const baseUrl2 = 'https://8ceaa6f6-5df8-4513-8a12-2869ace3d8d1.mock.pstmn.io/ssi/';
      const baseUrl3 = 'https://8ceaa6f6-5df8-4513-8a12-2869ace3d8d1.mock.pstmn.io/attribute/';

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
            .map(owner => ({
              ...data1,
              ...owner,
              PayeeAttributeFieldValue: attributeData?.PayeeAttributeFieldValue
            }));

          return mergedData
            .filter(item =>
              !currencyCodeFilter ||
              currencyCodeFilter.includes(item.Currency?.currencyCode?.toUpperCase())
            )
            .map(item => ({
              PayeeCode: item.PayeeCode,
              PayeeId: item.PayeeId,
              CurrencyCode: item.Currency?.currencyCode ?? null,
              BeneficiaryBankSwiftCode: item.InstitutionBank.BankAccount.Bic,
              BeneficiaryAccName: item.FinalBeneficiary.BankAccount.BankAccountName,
              BeneficiaryAccnoIBAN: item.InstitutionBank.BankAccount.Iban,
              BeneficiaryBankName: item.InstitutionBank.BankAddress.Name,
              BeneficiaryBankAddress1: item.InstitutionBank.BankAddress.AddressLine1,
              BeneficiaryBankAddress2: item.InstitutionBank.BankAddress.AddressLine2,
              BeneficiaryBankCountry: item.InstitutionBank.BankAddress.Country.CountryCode,
              BeneficiaryBankABAnumber: item.InstitutionBank.BankAccount.CountryIdentifier,
              BeneficiaryBankSortNumber: item.InstitutionBank.BankAccount.CountryIdentifier,
              SpecialInstructionsLine1: (item.BankSenderToReceiverInfo?.Notes || '').split('\n')[0] || '',
              SpecialInstructionsLine2: (item.BankSenderToReceiverInfo?.Notes || '').split('\n')[1] || '',
              SpecialInstructionsLine3: (item.BankSenderToReceiverInfo?.Notes || '').split('\n')[2] || '',
              SpecialInstructionsLine5: item.PayeeAttributeFieldValue,
              BeneficiaryPartyAddress1: item.FinalBeneficiary.BankAddress.AddressLine1,
              BeneficiaryPartyAddress2: item.FinalBeneficiary.BankAddress.AddressLine2,
              BeneficiaryBankAccNo: item.FinalBeneficiary.BankAccount.Iban,
              IntermediaryBankName: item.IntermediaryBank.BankAddress.Name,
              IntermediaryBankAddress1: item.IntermediaryBank.BankAddress.AddressLine1,
              IntermediaryBankAddress2: item.IntermediaryBank.BankAddress.AddressLine2,
              IntermediaryBankSwiftCode: item.IntermediaryBank.BankAccount.Bic,
              IntermediaryBankABANumber: item.IntermediaryBank.BankAccount.CountryIdentifier
            }));
        })
      );

      return {
        status: 200,
        jsonBody: results.flat()
      };

    } catch (err) {
      return {
        status: 500,
        jsonBody: { error: err.message }
      };
    }
  }
});



    const mergedData = data2
      .filter(owner => owner.Owner.Id === data1.PayeeId)
      .map(owner => {
        // Match on payeeCode to extract Status from data4
        const statusEntry = Array.isArray(data4)
          ? data4.find(entry => entry.payeeCode === data1.payeeCode)
          : data4[data1.payeeCode]; // fallback if data4 is an object

        return {
          ...data1,
          ...owner,
          PayeeAttributeFieldValue: attributeData?.PayeeAttributeFieldValue,
          Status: statusEntry?.Status // Include the Status from data4
        };
      });

    return mergedData;
