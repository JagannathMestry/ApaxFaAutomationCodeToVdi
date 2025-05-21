let mergedData = [];

if (Array.isArray(data2)) {
  mergedData = data2
    .filter(item => item?.Owner && item?.Owner?.Id === data1.PayeeId)
    .map(item => {
      const additionalMatch = additionalDataArray.find(
        a => String(a.PayeeCode) === String(data1.PayeeCode)
      );
      return {
        ...data1,
        ...item
      };
    });
}
