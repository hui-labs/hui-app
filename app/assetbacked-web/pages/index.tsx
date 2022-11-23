import useIsMounted from "../hooks/useIsMounted"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import styles from "../styles/Home.module.css"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { useGetMint } from "@/hooks/useGetMint"
import { USDCPubKey } from "@/constants"
import { useAssociatedAccount } from "@/hooks/useAssociatedAccount"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useGetAccount } from "@/hooks/useGetAccount"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { useBalance } from "@/hooks/useBalance"
import { useMintTo } from "@/hooks/useMintTo"

export default function Home() {
  const mounted = useIsMounted()
  const workspace = useWorkspace()
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const associatedAccount = useAssociatedAccount(workspace, usdcMint)
  const account = useGetAccount(workspace, associatedAccount)
  const [state, minTo] = useMintTo({
    workspace,
    mint: usdcMint,
    account,
    associatedAccount,
    decimals: 9,
  })
  const usdcBalance = useFormatUnit(account.value?.amount)
  const balance = useBalance(workspace)
  const solBalance = useFormatUnit(balance.value, LAMPORTS_PER_SOL)

  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>

      <button onClick={() => minTo()}>
        {state.loading ? "Loading..." : "Faucet +100 USDC"}
      </button>
      <div>
        <p>
          USDC Balance: <span>{usdcBalance}</span>
        </p>
        <p>
          Balance <span>{solBalance}</span>
        </p>
      </div>
    </div>
  )
}
