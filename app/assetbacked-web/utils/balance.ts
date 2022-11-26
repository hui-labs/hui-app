export const formatBalanceWithDecimal = (
  balance: string | number,
  decimal = 9
) => {
  if (typeof balance === "string") {
    balance = parseInt(balance)
  }
  return balance / Math.pow(10, decimal)
}
