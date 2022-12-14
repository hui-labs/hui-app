import React, { useState } from "react"
import { Button, Col, Row, Table, Tag, Tooltip, Typography } from "antd"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import { TOKEN_LISTS } from "@/common/constants"
import { useRouter } from "next/router"
import useAsyncEffect from "use-async-effect"
import { formatUnits } from "@ethersproject/units"
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
import { catchError } from "@/helps/notification"
import { LOAN_TERMS, LoanTerm } from "@/helps/coverMonth"
import { ModalSuccess } from "@/components/ModalSuccess"

const { Title } = Typography

interface DataType {
  key: React.Key
  isAdmin: boolean
  owner: PublicKey
  vaultMint: PublicKey
  vaultAccount: PublicKey
  collateralMint: PublicKey
  nftAccount?: PublicKey
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
    title: "Loan Currency",
    dataIndex: "vaultMint",
    key: "vaultMint",
    render: (_, { vaultMint }) => {
      return <span>{TOKEN_LISTS[vaultMint.toBase58()]}</span>
    },
  },
  {
    title: "Collateral Currency",
    dataIndex: "collateralMint",
    key: "collateralMint",
    render: (_, { collateralMint }) => {
      return <span>{TOKEN_LISTS[collateralMint.toBase58()]}</span>
    },
  },
  {
    title: "Wallet Address Of Borrower",
    dataIndex: "borrower",
    width: 600,
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
    title: "Maximum Loan Amount",
    dataIndex: "maxLoanAmount",
    key: "maxLoanAmount",
  },
  {
    title: "Fee",
    dataIndex: "fee",
    key: "fee",
  },
  {
    title: "Transaction Fee",
    dataIndex: "loanFee",
    key: "loanFee",
  },
  {
    title: "Minimum Loan Amount",
    dataIndex: "minLoanAmount",
    key: "minLoanAmount",
  },
  {
    title: () => (
      <Tooltip title="Maximum Loan-To-Value Ratio">
        <span>{"LTV Ratio"}</span>
      </Tooltip>
    ),
    dataIndex: "maxLoanThreshold",
    key: "maxLoanThreshold",
  },
  {
    title: "Loan Term (Month)",
    dataIndex: "loanTerm",
    key: "loanTerm",
    render: (term) => <span>{`${LOAN_TERMS[term as LoanTerm]} Month`}</span>,
  },
  {
    title: "Received Amount",
    dataIndex: "receivedAmount",
    key: "receivedAmount",
  },
  {
    title: "",
    render: (_, { onClaimNFT, onClaim, status, nftAccount }) => {
      if (!nftAccount)
        return (
          <Button
            className="bg-indigo-500 hover:bg-indigo-600"
            type="primary"
            onClick={() => onClaimNFT()}
          >
            Claim NFT
          </Button>
        )

      if (status === "final")
        return (
          <Button
            className="bg-indigo-500 hover:bg-indigo-600"
            type="primary"
            onClick={() => onClaim()}
          >
            Claim Fund
          </Button>
        )

      return null
    },
  },
]

const LoansOfPool: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  const workspace = useWorkspace()
  const [loans, setLoans] = useState<DataType[]>([])
  const decimals = 9
  const [created, setCreated] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [openPopupSuccess, setOpenPopupSuccess] = useState(false)
  const [titlePopup, setTitlePopup] = useState("")

  const onClaimNFT = async (
    masterLoanPubKey: PublicKey,
    poolPubKey: PublicKey,
    nftMint: PublicKey,
    loanMetadata: any,
    isClaimed: boolean
  ) => {
    try {
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

        const nftAccount = await getAssociatedTokenAddress(
          nftMint,
          wallet.publicKey
        )
        const tx = await program.methods
          .claimNft()
          .accounts({
            masterLoan: masterLoanPubKey,
            masterLoanPda: masterLoanPDA,
            nftMint,
            nftAccount,
            owner: wallet.publicKey,
            loanMetadata: loanMetadata.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
          })
          .preInstructions([
            await createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              nftAccount,
              wallet.publicKey,
              nftMint
            ),
          ])
          .rpc()
        setCreated(tx)
        setTitlePopup("Claim NFT Success")
        showPopupSuccess()
        console.log("tx", tx)
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("tx", err)
      }
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
    try {
      if (workspace.value) {
        console.log("nftAccount", nftAccount)
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
        setCreated(tx)
        setTitlePopup("Claim Fund Success")
        showPopupSuccess()
        console.log("tx", tx)
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("On Claim", err)
      }
    }
  }

  const loanMetadataFetcher = async (
    connection: web3.Connection,
    client: AnchorClient,
    loan: any
  ) => {
    try {
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
    } catch (err) {
      if (err instanceof Error) {
        catchError("Loan Meta Data Fetcher", err)
      }
    }
  }

  useAsyncEffect(async () => {
    setLoading(true)
    try {
      if (workspace.value) {
        const { wallet, client, connection } = workspace.value
        const loans = await client
          .from("MasterLoan")
          .offset(0)
          .limit(10)
          .select()
        const loansDetail = await Promise.all(
          loans.map((loan) => loanMetadataFetcher(connection, client, loan))
        )

        const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
          wallet.publicKey,
          {
            programId: TOKEN_PROGRAM_ID,
          }
        )

        const nftAccounts = allTokenAccounts.value
          .map((v) => {
            const { mint, tokenAmount } = v.account.data.parsed.info
            return {
              mint,
              tokenAmount,
              pubkey: v.pubkey,
            }
          })
          .filter(({ tokenAmount }) => {
            return tokenAmount.amount === "1" || tokenAmount.amount === "0"
          })
          .reduce<any>((acc, cur) => {
            acc[cur.mint] = {
              amount: cur.tokenAmount.uiAmount,
              pubkey: cur.pubkey,
            }
            return acc
          }, {})

        const masterLoans = loansDetail
          .filter((itemLoan) => {
            const hasNftAccount =
              nftAccounts[itemLoan.account.nftMint.toBase58()]
            return (
              itemLoan.account.pool.toBase58() === id &&
              ((hasNftAccount && hasNftAccount.amount > 0) ||
                !itemLoan.account.isClaimed)
            )
          })
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
              nftMint,
              vaultMint,
              vaultAccount,
              isClaimed,
            } = account
            const nftAccount = nftAccounts[nftMint.toBase58()]?.pubkey
            const status = loanMetadata
              ? Object.keys(loanMetadata.account.status)[0]
              : ""
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
              // isAdmin: mint.owner.toBase58() === wallet.publicKey.toBase58(),
              isAdmin: false,
              vaultMint: account.vaultMint,
              vaultAccount: account.vaultAccount,
              collateralMint: account.collateralMint,
              nftAccount,
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
      setLoading(false)
    } catch (err) {
      if (err instanceof Error) {
        catchError("Set Loans", err)
        setLoading(false)
      }
    }
  }, [id, workspace.value, created])

  const hidePopupSuccess = () => {
    setOpenPopupSuccess(false)
  }

  const showPopupSuccess = () => {
    setOpenPopupSuccess(true)
  }

  return (
    <div className="px-6 mt-5">
      <div className="flex justify-between items-center max-w-screen-2xl mx-auto mb-5">
        <Title level={2}>List Of Loans</Title>
      </div>

      <Row>
        <Col span={100}>
          <Table
            columns={columns}
            pagination={false}
            dataSource={loans}
            loading={loading}
          />
        </Col>
      </Row>
      <ModalSuccess
        isOpen={openPopupSuccess}
        onCancel={hidePopupSuccess}
        onSubmit={hidePopupSuccess}
        title={titlePopup}
      />
    </div>
  )
}

export default LoansOfPool
