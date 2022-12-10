import React, { useState } from "react"
import { Button, Col, Row, Space, Table, Tag, Typography } from "antd"
import { useWorkspace } from "@/hooks/useWorkspace"
import { TOKEN_LISTS } from "@/common/constants"
import { useRouter } from "next/router"
import useAsyncEffect from "use-async-effect"
import { formatUnits } from "@ethersproject/units"
import { ColumnsType } from "antd/es/table"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { web3 } from "@project-serum/anchor"
import { AnchorClient } from "@/services/anchorClient"
import bs58 from "bs58"

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
    title: "borrower",
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
    title: "Is Claimed",
    dataIndex: "isClaimed",
    key: "isClaimed",
    render: (_, { isClaimed }) => (
      <div>
        <Tag color={"blue"}>{isClaimed ? "True" : "False"}</Tag>
      </div>
    ),
  },
  {
    title: "Max Loan Amount",
    dataIndex: "maxLoanAmount",
    key: "maxLoanAmount",
  },
  {
    title: "fee",
    dataIndex: "fee",
    key: "fee",
  },
  {
    title: "loan Fee",
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
    dataIndex: "",
    key: "x",
    render: (_, { onClaimNFT }) => {
      return (
        <Space>
          <Button onClick={() => onClaimNFT()}>Claim NFT</Button>
        </Space>
      )
    },
  },
]

const LoansOfPool: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  const workspace = useWorkspace()
  const [loans, setLoans] = useState<DataType[]>([])
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

  const loanMetadataFetcher = async (client: AnchorClient, loan: any) => {
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
      const { wallet, client } = workspace.value
      const loans = await client.from("MasterLoan").offset(0).limit(10).select()
      const loansDetail = await Promise.all(
        loans.map((loan) => loanMetadataFetcher(client, loan))
      )
      const masterLoans = loansDetail
        .filter((itemLoan) => itemLoan.account.pool.toBase58() === id)
        .map(({ publicKey, account, loanMetadata }) => {
          const {
            collateralAccount,
            fee,
            fees: { loanFee, transferFee },
            loanTerm,
            pool,
            owner,
            borrower,
            receivedAmount,
            nftAccount,
            nftMint,
            isClaimed,
          } = account
          return {
            key: publicKey.toBase58(),
            owner: owner,
            borrower: borrower,
            collateralAccount,
            isClaimed,
            fee: formatUnits(fee.toString(), decimals),
            loanFee: formatUnits(loanFee.toString(), 4),
            transferFee: formatUnits(transferFee.toString(), decimals),
            loanTerm: Object.keys(loanTerm)[0],
            pool,
            receivedAmount: formatUnits(receivedAmount.toString(), decimals),
            isAdmin: account.owner.toBase58() === wallet.publicKey.toBase58(),
            vaultMint: account.vaultMint,
            vaultAccount: account.vaultAccount,
            collateralMint: account.collateralMint,
            status: "",
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
