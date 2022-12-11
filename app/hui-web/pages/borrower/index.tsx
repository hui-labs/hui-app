import React, { useMemo, useState } from "react"
import {
  Button,
  Col,
  Form,
  InputNumber,
  Modal,
  Row,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from "antd"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import type { ColumnsType } from "antd/es/table"
import {
  DEFAULT_DECIMALS,
  SystemFeeUSDTPubKey,
  TOKEN_LISTS,
  USDCPubKey,
  USDTPubKey,
} from "@/common/constants"
import { formatUnits } from "@ethersproject/units"
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js"
import {
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import useAsyncEffect from "use-async-effect"
import { BN } from "@project-serum/anchor"
import { getOrCreateAssociatedTokenAccount } from "@/services"
import bs58 from "bs58"
import { AnchorClient } from "@/services/anchorClient"
import { useGetMint } from "@/hooks/useGetMint"
import { useAccount } from "@/hooks/useAccount"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { catchError } from "@/helps/notification"
import { LOAN_TERMS, LoanTerm } from "@/helps/coverMonth"

const { Title } = Typography

interface LoanForm {
  loanTerm: string
  loanAmount: number
}

interface PoolDataType {
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
  loanTerm: string
  showModal: (data: PoolDataType) => void
}

const poolColumns: ColumnsType<PoolDataType> = [
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
    title: "Available Amount",
    dataIndex: "availableAmount",
    key: "availableAmount",
    render: (_, { availableAmount }) => {
      return <span>{availableAmount}</span>
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
    title: "Loan Term",
    dataIndex: "loanTerm",
    key: "loanTerm",
    render: (term) => <span>{`${LOAN_TERMS[term as LoanTerm]} Month`}</span>,
  },
  {
    title: "",
    dataIndex: "",
    key: "x",
    render: (data: PoolDataType, { showModal }) => {
      return (
        <Space>
          <Button
            className="bg-indigo-500"
            type="primary"
            onClick={() => showModal(data)}
          >
            Loan
          </Button>
        </Space>
      )
    },
  },
]

interface LoanDataType {
  key: React.Key
  isAdmin: boolean
  owner: PublicKey
  vaultMint: PublicKey
  vaultAccount: PublicKey
  collateralMint: PublicKey
  interestRate: string
  maxLoanAmount: string
  minLoanAmount: string
  maxLoanThreshold: string
  status: string
  loanTerm: string
  onFinal: () => void
}

const loanColumns: ColumnsType<LoanDataType> = [
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
  { title: "Interest Rate", dataIndex: "interestRate", key: "interestRate" },
  {
    title: "Max Loan Amount",
    dataIndex: "maxLoanAmount",
    key: "maxLoanAmount",
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
    title: "Loan",
    dataIndex: "receivedAmount",
    key: "receivedAmount",
  },
  {
    title: "Loan Term",
    dataIndex: "loanTerm",
    key: "loanTerm",
    render: (term) => <span>{`${LOAN_TERMS[term as LoanTerm]} Month`}</span>,
  },
  {
    title: "",
    dataIndex: "",
    key: "x",
    render: (_, { onFinal, status }) => {
      if (status === "final") return null

      return (
        <Space>
          <Button onClick={onFinal}>Final</Button>
        </Space>
      )
    },
  },
]

const decimals = 9

const BorrowerPage: React.FC = () => {
  const workspace = useWorkspace()
  const [form] = Form.useForm()
  const [availablePools, setAvailablePools] = useState<PoolDataType[]>([])
  const [myLoans, setMyLoans] = useState<LoanDataType[]>([])
  const [open, setOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [tabs, setTabs] = useState<string>("pool")
  const [poolDetails, setPoolDetails] = useState<PoolDataType>()
  const loanAmount = Form.useWatch("loanAmount", form)
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint)
  const usdtAccount = useAccount(workspace, usdtMint)
  const usdcBalance = useFormatUnit(usdcAccount.value?.amount)
  const usdtBalance = useFormatUnit(usdtAccount.value?.amount)
  const [created, setCreated] = useState<string | null>(null)

  const handleSubmit = async (data: LoanForm) => {
    try {
      if (data && selectedPool && workspace.value) {
        const loanAmount = data?.loanAmount

        setConfirmLoading(true)
        const pool = availablePools.find(
          (v) => v.key === selectedPool.toBase58()
        )
        if (pool) {
          const { wallet, connection } = workspace.value
          const depositorMint = await getMint(connection, pool.collateralMint)
          const depositorAccount = await getOrCreateAssociatedTokenAccount(
            workspace.value,
            wallet.publicKey,
            depositorMint
          )

          const receiverMint = await getMint(connection, pool.vaultMint)
          const receiverAccount = await getOrCreateAssociatedTokenAccount(
            workspace.value,
            wallet.publicKey,
            receiverMint
          )

          const tx = await onCreateLoan(
            loanAmount,
            selectedPool,
            depositorAccount.address,
            receiverAccount.address
          )

          setOpen(false)
          setCreated(tx)
        }
        setConfirmLoading(false)
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("Handle Submit", err)
      }
    }
  }

  const handleCancel = () => {
    setOpen(false)
  }

  const onCreateLoan = async (
    amount: number,
    poolPubkey: PublicKey,
    tokenDepositorPubkey: PublicKey,
    tokenReceiverPubkey: PublicKey
  ) => {
    try {
      if (workspace.value) {
        const { wallet, program } = workspace.value
        const poolAccount = await program.account.pool.fetch(poolPubkey)

        const [poolPDA] = await PublicKey.findProgramAddress(
          [
            Buffer.from("pool"),
            poolAccount.owner.toBuffer(),
            poolAccount.collateralMint.toBuffer(),
            poolAccount.vaultMint.toBuffer(),
          ],
          program.programId
        )

        const masterLoan = Keypair.generate()
        const loanMetadata = Keypair.generate()
        const [loanPDA] = await PublicKey.findProgramAddress(
          [Buffer.from("masterLoan"), poolPubkey.toBuffer()],
          program.programId
        )

        const collateralAccountKeypair = Keypair.generate()
        const nftMintKeypair = Keypair.generate()

        return await program.methods
          .initLoan(new BN(amount * DEFAULT_DECIMALS))
          .accounts({
            collateralMint: poolAccount.collateralMint,
            collateralAccount: collateralAccountKeypair.publicKey,
            nftMint: nftMintKeypair.publicKey,
            masterLoan: masterLoan.publicKey,
            pool: poolPubkey,
            poolPda: poolPDA,
            loanPda: loanPDA,
            poolVault: poolAccount.vaultAccount,
            borrower: wallet.publicKey,
            systemFeeAccount: SystemFeeUSDTPubKey,

            loanMetadata: loanMetadata.publicKey,
            tokenDepositor: tokenDepositorPubkey,
            tokenReceiver: tokenReceiverPubkey,

            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .preInstructions([
            await program.account.masterLoan.createInstruction(masterLoan),
            await program.account.loanMetadata.createInstruction(loanMetadata),
          ])
          .signers([
            masterLoan,
            loanMetadata,
            nftMintKeypair,
            collateralAccountKeypair,
          ])
          .rpc()
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("On Create Loan", err)
      }
    }

    return null
  }
  const [selectedPool, setSelectedPool] = useState<PublicKey | null>(null)

  const loanMetadataFetcher = async (client: AnchorClient, loan: any) => {
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

  const onFinal = async (
    masterLoanPubKey: PublicKey,
    poolPubKey: PublicKey,
    vaultMint: PublicKey,
    collateralMint: PublicKey,
    collateralAccount: PublicKey,
    loanMetadata: any
  ) => {
    try {
      if (workspace.value) {
        const { program, wallet } = workspace.value
        const [masterLoanPDA] = await PublicKey.findProgramAddress(
          [Buffer.from("masterLoan"), poolPubKey.toBuffer()],
          program.programId
        )
        const tokenDepositor = await getAssociatedTokenAddress(
          vaultMint,
          wallet.publicKey
        )
        const tokenReceiver = await getAssociatedTokenAddress(
          collateralMint,
          wallet.publicKey
        )

        const vaultAccountKeypair = Keypair.generate()
        const tx = await program.methods
          .finalSettlement(new BN((80 + 5.99999976) * DEFAULT_DECIMALS))
          .accounts({
            masterLoan: masterLoanPubKey,
            masterLoanPda: masterLoanPDA,
            tokenDepositor,
            tokenReceiver,
            depositor: wallet.publicKey,
            collateralAccount,
            vaultMint,
            vaultAccount: vaultAccountKeypair.publicKey,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            loanMetadata: loanMetadata.publicKey,
          })
          .signers([vaultAccountKeypair])
          .rpc()
        console.log(tx)
        await getAssociatedTokenAddress(
          loanMetadata.account.nftMint,
          wallet.publicKey
        )

        console.log(
          "loanMetadata.account.nftMint",
          loanMetadata.account.nftMint.toBase58()
        )
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("On Final", err)
      }
    }
  }

  useAsyncEffect(async () => {
    try {
      if (workspace.value) {
        const { wallet, client } = workspace.value
        const loans = await client
          .from("MasterLoan")
          .offset(0)
          .limit(10)
          .select()
        const loansDetail = await Promise.all(
          loans.map((loan) => loanMetadataFetcher(client, loan))
        )

        const rawData: LoanDataType[] = loansDetail
          .filter((v) => v.loanMetadata)
          .map(({ publicKey, account, loanMetadata }) => {
            const status = loanMetadata
              ? Object.keys(loanMetadata?.account.status)[0]
              : ""
            return {
              key: publicKey.toBase58(),
              owner: account.owner,
              isAdmin:
                account.borrower.toBase58() === wallet.publicKey.toBase58(),
              vaultMint: account.vaultMint,
              vaultAccount: account.vaultAccount,
              collateralMint: account.collateralMint,
              status,
              loanTerm: Object.keys(account.loanTerm)[0],
              minLoanAmount: formatUnits(
                account.minLoanAmount.toString(),
                decimals
              ),
              maxLoanAmount: formatUnits(
                account.maxLoanAmount.toString(),
                decimals
              ),
              receivedAmount: formatUnits(
                account.receivedAmount.toString(),
                decimals
              ),
              interestRate: formatUnits(account.interestRate.toString(), 4),
              maxLoanThreshold: formatUnits(
                account.maxLoanThreshold.toString(),
                4
              ),
              onFinal: () =>
                onFinal(
                  publicKey,
                  account.pool,
                  account.vaultMint,
                  account.collateralMint,
                  account.collateralAccount,
                  loanMetadata
                ),
            }
          })

        // const accounts = await Promise.all(
        //   rawData.map((item) =>
        //     getAccount(connection, item.vaultAccount, commitmentLevel)
        //   )
        // )

        const cache = rawData.reduce((acc, cur) => {
          acc[cur.vaultAccount.toBase58()] = cur
          return acc
        }, {} as Record<string, LoanDataType>)

        // accounts.forEach((account) => {
        //   if (account.address.toBase58() in cache) {
        //     cache[account.address.toBase58()].availableAmount = formatUnits(
        //       account.amount,
        //       9
        //     )
        //   }
        // })

        const data = Object.values(cache).reduce(
          (acc, cur) => {
            acc[cur.isAdmin ? 0 : 1].push(cur)
            return acc
          },
          [[], []] as [LoanDataType[], LoanDataType[]]
        )

        setMyLoans(data[0])
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("Set My Loans", err)
      }
    }
  }, [workspace.value, created])

  useAsyncEffect(async () => {
    try {
      if (workspace.value) {
        const { connection, wallet, client } = workspace.value
        const pools = await client.from("Pool").offset(0).limit(10).select()

        const rawData: PoolDataType[] = pools.map(({ publicKey, account }) => {
          return {
            key: publicKey.toBase58(),
            owner: account.owner,
            isAdmin: account.owner.toBase58() === wallet.publicKey.toBase58(),
            vaultMint: account.vaultMint,
            vaultAccount: account.vaultAccount,
            collateralMint: account.collateralMint,
            status: Object.keys(account.status)[0],
            loanTerm: Object.keys(account.loanTerm)[0],
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
            showModal: (data: PoolDataType) => {
              setSelectedPool(publicKey)
              showModal(data)
            },
          }
        })

        const accounts = await Promise.all(
          rawData.map((item) =>
            getAccount(connection, item.vaultAccount, commitmentLevel)
          )
        )

        const cache = rawData.reduce((acc, cur) => {
          acc[cur.vaultAccount.toBase58()] = cur
          return acc
        }, {} as Record<string, PoolDataType>)

        accounts.forEach((account) => {
          if (account.address.toBase58() in cache) {
            cache[account.address.toBase58()].availableAmount = formatUnits(
              account.amount,
              9
            )
          }
        })

        const data = Object.values(cache).reduce(
          (acc, cur) => {
            acc[cur.isAdmin ? 0 : 1].push(cur)
            return acc
          },
          [[], []] as [PoolDataType[], PoolDataType[]]
        )
        setAvailablePools(() => data[1])
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("Set Available Pools", err)
      }
    }
  }, [workspace.value, created])

  const showModal = (data: PoolDataType) => {
    setPoolDetails(data)
    setOpen(true)
  }

  const showAvailableCollateral = useMemo(() => {
    if (!poolDetails) return undefined
    const compare =
      TOKEN_LISTS[poolDetails?.collateralMint.toBase58()].toLowerCase()

    return compare === "usdc" ? parseInt(usdcBalance) : parseInt(usdtBalance)
  }, [poolDetails, usdtBalance, usdcBalance])

  return (
    <div className="px-6 mt-5">
      <Title className="max-w-screen-xl mx-auto" level={2}>
        Borrower
      </Title>
      <div className="flex justify-between items-center max-w-screen-xl mx-auto mt-10">
        <Title level={3}>
          {tabs === "loan" ? "Your Loans" : "Available Pools"}
        </Title>
        <Segmented
          className="bg-indigo-500 text-white selection:bg-amber-400 hover:text-white my-5"
          size="large"
          options={[
            {
              label: "Available Pools",
              value: "pool",
            },
            { label: "Your Loan", value: "loan" },
          ]}
          onChange={(v) => setTabs(v as string)}
        />
      </div>

      {tabs === "loan" && (
        <div>
          <Row>
            <Col span={24}>
              <Table
                columns={loanColumns}
                pagination={false}
                dataSource={myLoans}
              />
            </Col>
          </Row>
        </div>
      )}

      {tabs === "pool" && (
        <div>
          <Row>
            <Col span={24}>
              <Table
                columns={poolColumns}
                pagination={false}
                dataSource={availablePools}
              />
            </Col>
          </Row>
        </div>
      )}

      <Modal
        title="Title"
        width={600}
        open={open}
        onOk={() => form.submit()}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        okButtonProps={{ className: "bg-indigo-500" }}
      >
        {poolDetails && (
          <>
            <div className="flex justify-between mb-4 px-5 mt-7">
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Vault Token</h4>
                <p>{TOKEN_LISTS[poolDetails.vaultMint.toBase58()]}</p>
              </div>
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Collateral Token</h4>
                <p>{TOKEN_LISTS[poolDetails.collateralMint.toBase58()]}</p>
              </div>
            </div>
            <div className="flex justify-between mb-4 px-5">
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Top Up Amount</h4>
                <p>{poolDetails.availableAmount}</p>
              </div>
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Interest Rate/Year</h4>
                <p>{`${poolDetails.interestRate} %`}</p>
              </div>
            </div>
            <div className="flex justify-between mb-4 px-5">
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Max Loan Amount</h4>
                <p>{poolDetails.maxLoanAmount}</p>
              </div>
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Min Loan Amount</h4>
                <p>{poolDetails.minLoanAmount}</p>
              </div>
            </div>
            <div className="flex justify-between mb-4 px-5">
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Max Loan Threshold</h4>
                <p>{`${poolDetails.maxLoanThreshold} %`}</p>
              </div>
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Loan Term</h4>
                <p>{`${LOAN_TERMS[poolDetails.loanTerm as LoanTerm]} Month`}</p>
              </div>
            </div>
            <div className="flex justify-between mb-4 px-5">
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Collateral Amount</h4>
                {/*formula is loanAmount / maxLoanThreshold * 100 */}
                <p>
                  {loanAmount
                    ? (
                        (loanAmount * 100) /
                        parseInt(poolDetails.maxLoanThreshold)
                      ).toFixed(2)
                    : 0}
                </p>
              </div>
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Pay</h4>
                {/*formula is loanAmount + loanAmount / interestRate * loanTerm (here is 6 month)*/}
                <p>
                  {loanAmount
                    ? (
                        (loanAmount *
                          parseFloat(poolDetails.interestRate) *
                          LOAN_TERMS[poolDetails.loanTerm as LoanTerm]) /
                          1200 +
                        loanAmount
                      ).toFixed(2)
                    : 0}
                </p>
              </div>
            </div>
          </>
        )}
        <Row>
          <Col span={24}>
            <Form
              layout="vertical"
              form={form}
              name="control-hooks"
              onFinish={handleSubmit}
            >
              {poolDetails && (
                <Form.Item
                  name="loanAmount"
                  label="Loan Amount"
                  rules={[
                    { required: true },
                    {
                      type: "number",
                      max: parseInt(poolDetails.maxLoanAmount),
                      message: "can't set value > max loan amount",
                    },
                    {
                      type: "number",
                      max: parseInt(poolDetails.availableAmount),
                      message: "not enough token for loan",
                    },
                    {
                      type: "number",
                      max: showAvailableCollateral,
                      message: "not enough Collateral",
                    },
                    {
                      type: "number",
                      min: parseInt(poolDetails.minLoanAmount),
                      message: "can't set value < min loan amount",
                    },
                  ]}
                >
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
              )}
            </Form>
          </Col>
        </Row>
      </Modal>
    </div>
  )
}

export default BorrowerPage
