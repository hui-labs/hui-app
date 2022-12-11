import React, { useState } from "react"
import { Button, Col, Row, Table, Tag, Typography } from "antd"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import { TOKEN_LISTS } from "@/common/constants"
import { useRouter } from "next/router"
import useAsyncEffect from "use-async-effect"
import { ColumnsType } from "antd/es/table"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { web3 } from "@project-serum/anchor"
import { AnchorClient } from "@/services/anchorClient"
import bs58 from "bs58"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { Database } from "@/types/supabase"
import { formatUnits } from "@ethersproject/units"

const { Title } = Typography

interface DataType {
  key: React.Key
  isAdmin: boolean
  owner: PublicKey
  vaultMint: PublicKey
  vaultAccount: PublicKey
  collateralMint: PublicKey
  availableAmount: string
  interestRate: string
  maxLoanAmount: string
  minLoanAmount: string
  maxLoanThreshold: string
  status: string
  isClaimed: boolean
  borrower: PublicKey
  onClaimNFT: () => void
  onClaim: () => void
}

const columns: ColumnsType<DataType> = [
  {
    title: "Vault Token",
    dataIndex: "vaultMint",
    key: "vaultMint",
    render: (_, { vaultMint }) => {
      return <span>{TOKEN_LISTS[vaultMint.toBase58()]}</span>
    },
  },
  {
    title: "Collateral Token",
    dataIndex: "collateralMint",
    key: "collateralMint",
    render: (_, { collateralMint }) => {
      return <span>{TOKEN_LISTS[collateralMint.toBase58()]}</span>
    },
  },
  {
    title: "Borrower",
    dataIndex: "borrower",
    width: 1000,

    key: "borrower",
    render: (_, { borrower }) => {
      return <span>{borrower.toBase58()}</span>
    },
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (_, { status }) => (
      <div>
        <Tag color={"blue"}>{status.toUpperCase()}</Tag>
      </div>
    ),
  },
  { title: "Interest Rate", dataIndex: "interestRate", key: "interestRate" },
  {
    title: "Max Loan Amount",
    dataIndex: "maxLoanAmount",
    key: "maxLoanAmount",
  },
  {
    title: "Fee",
    dataIndex: "fee",
    key: "fee",
  },
  {
    title: "Loan Fee",
    dataIndex: "loanFee",
    key: "loanFee",
  },
  {
    title: "Min Loan Amount",
    dataIndex: "minLoanAmount",
    key: "minLoanAmount",
  },
  {
    title: "Max Loan Threshold",
    dataIndex: "maxLoanThreshold",
    key: "maxLoanThreshold",
  },
  {
    title: "LoanTerm",
    dataIndex: "loanTerm",
    key: "loanTerm",
  },
  {
    title: "Received Amount",
    dataIndex: "receivedAmount",
    key: "receivedAmount",
  },
  {
    title: "Action",
    render: (_, { onClaimNFT, onClaim, isClaimed, status }) => {
      if (status === "opening" && !isClaimed)
        return <Button onClick={() => onClaimNFT()}>Claim NFT</Button>

      if (status === "final")
        return <Button onClick={() => onClaim()}>Claim Fund</Button>

      return null
    },
  },
]

const LoansOfPool: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  const workspace = useWorkspace()
  const [loans, setLoans] = useState<DataType[]>([])
  const supabase = useSupabaseClient<Database>()
  const decimals = 9

  const onClaimNFT = async (
    masterLoanPubKey: PublicKey,
    poolPubKey: PublicKey,
    nftMint: PublicKey,
    loanMetadata: any,
    isClaimed: boolean
  ) => {
    if (isClaimed) {
      console.log("You have already claimed")
      return null
    }
    if (workspace.value) {
      const { program, wallet } = workspace.value

      const [masterLoanPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("masterLoan"), poolPubKey.toBuffer()],
        program.programId
      )

      const associatedNftTokenAccount = await getAssociatedTokenAddress(
        nftMint,
        wallet.publicKey
      )
      const tx = await program.methods
        .claimNft()
        .accounts({
          masterLoan: masterLoanPubKey,
          masterLoanPda: masterLoanPDA,
          nftMint,
          nftAccount: associatedNftTokenAccount,
          owner: wallet.publicKey,
          loanMetadata: loanMetadata.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .preInstructions([
          await createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            associatedNftTokenAccount,
            wallet.publicKey,
            nftMint
          ),
        ])
        .rpc()
      console.log("tx", tx)
    }
  }

  const onClaim = async (
    masterLoanPubKey: PublicKey,
    poolPubKey: PublicKey,
    nftMint: PublicKey,
    vaultMint: PublicKey,
    vaultAccount: PublicKey,
    loanMetadata: any,
    status: string,
    nftAccount?: PublicKey
  ) => {
    if (workspace.value) {
      if (status !== "final") {
        console.log("Do not allow to claim")
        return
      }

      if (!nftAccount) {
        console.log("Do not allow to claim")
        return
      }

      const { program, wallet, connection } = workspace.value

      const [masterLoanPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("masterLoan"), poolPubKey.toBuffer()],
        program.programId
      )

      const vaultAssociatedAccount = await getAssociatedTokenAddress(
        vaultMint,
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )

      const walletVaultAccount = await getAccount(
        connection,
        vaultAssociatedAccount,
        commitmentLevel
      )

      const tx = await program.methods
        .claimLoan()
        .accounts({
          masterLoan: masterLoanPubKey,
          masterLoanPda: masterLoanPDA,
          owner: wallet.publicKey,
          nftAccount,
          nftMint,
          vaultAccount,
          tokenAccount: walletVaultAccount.address,
          loanMetadata: loanMetadata.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
      console.log("tx", tx)
    }
  }

  const loanMetadataFetcher = async (
    connection: web3.Connection,
    client: AnchorClient,
    loan: any
  ) => {
    const loanMetadata = await client
      .from("LoanMetadata")
      .filters([
        {
          memcmp: {
            offset: 8 + 32,
            bytes: bs58.encode(loan.publicKey.toBuffer()),
          },
        },
      ])
      .limit(1)
      .one()

    return {
      ...loan,
      loanMetadata,
    }
  }

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { wallet, client, connection } = workspace.value
      const { data: metadata, error } = await supabase
        .from("metadata")
        .select("*, master_loan (*)")
        .eq("pool", id)
      console.log("loans", loans)

      if (error) throw error
      if (!metadata) throw new Error("Can not get loans")

      const nftMints = metadata.map((l) => l.nft_mint)

      const masterLoans = metadata
        // .filter((loan) => {
        //   const hasNftAccount = nftAccounts[itemLoan.account.nftMint.toBase58()]
        //   return (
        //     itemLoan.account.pool.toBase58() === id &&
        //     ((hasNftAccount && hasNftAccount.amount > 0) ||
        //       !itemLoan.account.isClaimed)
        //   )
        // })
        .map((metadata) => {
          const nftAccount = nftAccounts[nftMint.toBase58()]?.pubkey
          const masterLoan: Database["public"]["Tables"]["master_loans"]["Row"] =
            metadata.master_loan as any
          const status = m.status
          return {
            key: metadata.pubkey,
            borrower: masterLoan.owner,
            collateralAccount: metadata.master_loan,
            isClaimed: metadata.is_claimed,
            fee: formatUnits(fee.toString(), decimals),
            loanFee: formatUnits(loanFee.toString(), 4),
            transferFee: formatUnits(transferFee.toString(), decimals),
            loanTerm: Object.keys(loanTerm)[0],
            pool,
            receivedAmount: formatUnits(receivedAmount.toString(), decimals),
            // isAdmin: mint.owner.toBase58() === wallet.publicKey.toBase58(),
            isAdmin: false,
            vaultMint: account.vaultMint,
            vaultAccount: account.vaultAccount,
            collateralMint: account.collateralMint,
            status,
            availableAmount: "0",
            minLoanAmount: formatUnits(
              account.minLoanAmount.toString(),
              decimals
            ),
            maxLoanAmount: formatUnits(
              account.maxLoanAmount.toString(),
              decimals
            ),
            interestRate: formatUnits(account.interestRate.toString(), 4),
            maxLoanThreshold: formatUnits(
              account.maxLoanThreshold.toString(),
              4
            ),
            onClaimNFT: () =>
              onClaimNFT(publicKey, pool, nftMint, loanMetadata, isClaimed),
            onClaim: () =>
              onClaim(
                publicKey,
                pool,
                nftMint,
                vaultMint,
                vaultAccount,
                loanMetadata,
                status,
                nftAccount
              ),
          }
        })

      setLoans(masterLoans)
    }
  }, [id, workspace.value])

  return (
    <div className="px-6 mt-5 max-w-screen-lg mx-auto">
      <div className="flex justify-between items-center mb-5">
        <Title level={2}>Details</Title>
      </div>

      <Row>
        <Col span={100}>
          <Table columns={columns} pagination={false} dataSource={loans} />
        </Col>
      </Row>
    </div>
  )
}

export default LoansOfPool
