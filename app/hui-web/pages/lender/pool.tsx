import React, { useState } from "react"
import { Button, Col, Row, Space, Table, Tag } from "antd"
import { useWorkspace } from "@/hooks/useWorkspace"
import { TOKEN_LISTS } from "@/common/constants"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import useIsMounted from "@/hooks/useIsMounted"
import { useRouter } from "next/router"
import useAsyncEffect from "use-async-effect"
import { formatUnits } from "@ethersproject/units"
import { DataType } from "@/pages/lender/index"
import { ColumnsType } from "antd/es/table"
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { web3 } from "@project-serum/anchor"

const columns: ColumnsType<
  DataType & { borrower: PublicKey; onClaimNFT: () => void }
> = [
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
    render: (_, { onClaimNFT, availableAmount, isAdmin }) => {
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
  const mounted = useIsMounted()
  const workspace = useWorkspace()
  const [loans, setLoans] = useState<any[]>([])
  const decimals = 9

  const onClaimNFT = async (
    masterLoanPubKey: PublicKey,
    poolPubKey: PublicKey,
    nftAccount: PublicKey,
    nftMint: PublicKey,
    isClaimed: boolean
  ) => {
    if (isClaimed) {
      console.log("You have already claimed")
      return null
    }
    if (workspace.value) {
      const { program, wallet } = workspace.value

      const loanMetadataKeypair = Keypair.generate()
      const claimAccountKeypair = Keypair.generate()

      const [masterLoanPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("masterLoan"), poolPubKey.toBuffer()],
        program.programId
      )
      const [loanMetadataPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("loan"),
          masterLoanPubKey.toBuffer(),
          nftAccount.toBuffer(),
          nftMint.toBuffer(),
        ],
        SystemProgram.programId
      )

      const tx = await program.methods
        .claimNft()
        .accounts({
          masterLoan: masterLoanPubKey,
          masterLoanPda: masterLoanPDA,
          nftMint,
          nftAccount,
          claimAccount: claimAccountKeypair.publicKey,
          owner: wallet.publicKey,
          loanMetadata: loanMetadataKeypair.publicKey,
          loanMetadataPda: loanMetadataPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([loanMetadataKeypair, claimAccountKeypair])
        .preInstructions([
          await program.account.loanMetadata.createInstruction(
            loanMetadataKeypair
          ),
        ])
        .rpc()
      console.log("tx", tx)
    }
  }

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { program, wallet } = workspace.value
      const allLoanOnProgram = await program.account.masterLoan.all()
      const masterLoans = allLoanOnProgram
        .filter((itemLoan) => itemLoan.account.pool.toBase58() === id)
        .map(({ publicKey, account }) => {
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
            fee: formatUnits(fee.toString(), decimals),
            loanFee: formatUnits(loanFee.toString(), decimals),
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
              onClaimNFT(publicKey, pool, nftAccount, nftMint, isClaimed),
          }
        })

      setLoans(masterLoans)
    }
  }, [id, workspace.value])

  return (
    <div>
      <div>{mounted && <WalletMultiButton />}</div>
      <Row>
        <Col span={100}>
          <Table columns={columns} pagination={false} dataSource={loans} />
        </Col>
      </Row>
    </div>
  )
}

export default LoansOfPool
