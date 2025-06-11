"CountryIdentifier": 
  record.BeneficiaryBankABAnumber && record.BeneficiaryBankABAnumber !== "NULL" && record.BeneficiaryBankABAnumber !== ""
    ? record.BeneficiaryBankABAnumber
    : (record.BeneficiaryBankSortNumber && record.BeneficiaryBankSortNumber !== "NULL" && record.BeneficiaryBankSortNumber !== "")
      ? record.BeneficiaryBankSortNumber
      : ""


"Notes": 
  (record.SpecialInstructionsLine1 === "NULL" ? "" : record.SpecialInstructionsLine1 + "\n") +
  (record.SpecialInstructionsLine2 === "NULL" ? "" : record.SpecialInstructionsLine2 + "\n") +
  (record.SpecialInstructionsLine3 === "NULL" ? "" : record.SpecialInstructionsLine3)
