export const parseError = (error) => {
  if (typeof error !== "string") return error;
  if (error.includes("No utxos found for address"))
    return "Not enough balance.";
  if (error.includes("Not enough cardinal spendable funds"))
    return error.replace(
      "Not enough cardinal spendable funds",
      "Not enough funds"
    );
  return error;
};
