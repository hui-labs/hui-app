import useIsMounted from "../hooks/useIsMounted"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import styles from "../styles/Home.module.css"
import { useGetMint } from "@/hooks/useGetMint"
import {
  SystemFeeUSDCPubKey,
  SystemFeeUSDTPubKey,
  USDCPubKey,
  USDTPubKey,
} from "@/common/constants"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { useBalance } from "@/hooks/useBalance"
import { useAccount } from "@/hooks/useAccount"
import { useMintTo } from "@/hooks/useMintTo"

export const Airdrop = () => {
  const workspace = useWorkspace()
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint)
  const usdtAccount = useAccount(workspace, usdtMint)
  const [usdcState, mintUSDCTo] = useMintTo({
    workspace,
    mint: usdcMint,
    account: usdcAccount,
  })
  const [usdtState, mintUSDTTo] = useMintTo({
    workspace,
    mint: usdtMint,
    account: usdtAccount,
  })
  const usdcBalance = useFormatUnit(usdcAccount.value?.amount)
  const usdtBalance = useFormatUnit(usdtAccount.value?.amount)
  const balance = useBalance(workspace)
  const solBalance = useFormatUnit(balance.value)

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
          <span>{usdcAccount.loading ? "Loading..." : usdcBalance}</span>
        </p>
        <p>
          USDT Balance:{" "}
          <span>{usdtAccount.loading ? "Loading..." : usdtBalance}</span>
        </p>
        <p>
          Balance <span>{balance.loading ? "Loading..." : solBalance}</span>
        </p>
      </div>
    </div>
  )
}

const SystemInfo = () => {
  const workspace = useWorkspace()
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint, SystemFeeUSDCPubKey)
  const usdtAccount = useAccount(workspace, usdtMint, SystemFeeUSDTPubKey)
  const usdcBalance = useFormatUnit(usdcAccount.value?.amount)
  const usdtBalance = useFormatUnit(usdtAccount.value?.amount)

  return (
    <div>
      <p>
        System Fee USDT:{" "}
        <span>{usdcAccount.loading ? "Loading" : usdcBalance}</span>
      </p>
      <p>
        System Fee USDC:{" "}
        <span>{usdtAccount.loading ? "Loading" : usdtBalance}</span>
      </p>
    </div>
  )
}

export default function Home() {
  const mounted = useIsMounted()
  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>
      <Airdrop />
      <hr />
      <SystemInfo />
    </div>
  )
}
