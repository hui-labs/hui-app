import { formatBalanceWithDecimal } from "@/utils/balance"
import { useAirdrop } from "@/pages/components/AirDrop/useAirDrop"

export const Airdrop = () => {
  const {
    mintUSDCTo,
    mintUSDTTo,
    usdcState,
    usdtState,
    usdcAccount,
    usdcBalance,
    usdtAccount,
    balance,
    usdtBalance,
    solBalance,
  } = useAirdrop()

  return (
    <div>
      <button onClick={() => mintUSDCTo()}>
        {usdcState.loading ? "Loading..." : "Faucet +100 USDC"}
      </button>
      <button onClick={() => mintUSDTTo()}>
        {usdtState.loading ? "Loading..." : "Faucet +100 USDT"}
      </button>
      <div>
        <p>
          USDC Balance:{" "}
          <span>
            {usdcAccount.loading
              ? "Loading..."
              : formatBalanceWithDecimal(usdcBalance, 9)}
          </span>
        </p>
        <p>
          USDT Balance:{" "}
          <span>
            {usdtAccount.loading
              ? "Loading..."
              : formatBalanceWithDecimal(usdtBalance, 9)}
          </span>
        </p>
        <p>
          Balance{" "}
          <span>
            {balance.loading
              ? "Loading..."
              : formatBalanceWithDecimal(solBalance, 9)}
          </span>
        </p>
      </div>
    </div>
  )
}
