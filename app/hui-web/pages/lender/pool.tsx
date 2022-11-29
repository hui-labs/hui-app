import React, { useCallback, useMemo } from "react"
import {
  Button,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  FormRule,
} from "antd"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import { BN, web3 } from "@project-serum/anchor"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import { SystemFeeUSDTPubKey, USDCPubKey, USDTPubKey } from "@/common/constants"
import { useGetMint } from "@/hooks/useGetMint"
import { useAccount } from "@/hooks/useAccount"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import useIsMounted from "@/hooks/useIsMounted"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { useRouter } from "next/router"

const LoansOfPool: React.FC = () => {
  const router = useRouter()
  const data = router.query
  console.log("query", data)

  return null
}

export default LoansOfPool
