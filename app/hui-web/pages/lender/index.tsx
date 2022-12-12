import React, { useRef, useState } from "react"
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
  Tooltip,
  Typography,
} from "antd"
import { useRouter } from "next/router"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import type { ColumnsType } from "antd/es/table"
import { TOKEN_LISTS } from "@/common/constants"
import { formatUnits, parseUnits } from "@ethersproject/units"
import { PublicKey } from "@solana/web3.js"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import useAsyncEffect from "use-async-effect"
import * as anchor from "@project-serum/anchor"
import { BN } from "@project-serum/anchor"
import { getOrCreateAssociatedTokenAccount } from "@/services"
import { catchError } from "@/helps/notification"
import { LOAN_TERMS, LoanTerm } from "@/helps/coverMonth"

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
  loanTerm: string
  onDeposit: () => void
  onClose: () => void
  onShow: () => void
  onWithdraw: (amount: BN) => void
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
    title: "Lending Limit",
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
    render: (status) => {
      return (
        <div>
          <Tag color={"blue"}>{Object.keys(status)[0].toUpperCase()}</Tag>
        </div>
      )
    },
  },
  {
    title: "Interest Rate/ Year",
    dataIndex: "interestRate",
    key: "interestRate",
    render: (rate) => <span>{`${rate} %`}</span>,
  },
  {
    title: "Loan Term",
    dataIndex: "loanTerm",
    key: "loanTerm",
    render: (term) => (
      <span>{`${LOAN_TERMS[Object.keys(term)[0] as LoanTerm]} Month`}</span>
    ),
  },
  {
    title: "Maximum Loan Amount",
    dataIndex: "maxLoanAmount",
    key: "maxLoanAmount",
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
    render: (rate) => <span>{`${rate} %`}</span>,
  },
  {
    title: "",
    dataIndex: "",
    key: "x",
    render: (
      _,
      { onWithdraw, onShow, onDeposit, availableAmount, isAdmin }
    ) => {
      return (
        <Space>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onShow()
            }}
          >
            View
          </Button>
          {isAdmin && (
            <>
              <Button
                onClick={() =>
                  onWithdraw(new BN(parseUnits(availableAmount, 9).toString()))
                }
              >
                Withdraw
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeposit()
                }}
              >
                Deposit
              </Button>
            </>
          )}
        </Space>
      )
    },
  },
]

const LenderPage: React.FC = () => {
  const router = useRouter()
  const workspace = useWorkspace()
  const [myPools, setMyPools] = useState<DataType[]>([])
  const [allPools, setAllPools] = useState<DataType[]>([])
  const decimals = 9
  const poolSelectedRef = useRef<any>({ poolPubKey: "", vaultAccount: "" })
  const [tabs, setTabs] = useState<string>("myPools")
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [_, triggerReload] = useState(false)
  const [loading, setLoading] = useState<boolean>(false)

  const onWithdraw = async (
    poolPubKey: PublicKey,
    poolVaultPubkey: PublicKey,
    vaultMint: PublicKey,
    collateralMint: PublicKey,
    amount: BN
  ) => {
    try {
      if (workspace.value) {
        const { program, wallet, connection } = workspace.value

        const [poolPDA] = await PublicKey.findProgramAddress(
          [
            Buffer.from("pool"),
            wallet.publicKey.toBuffer(),
            collateralMint.toBuffer(),
            vaultMint.toBuffer(),
          ],
          program.programId
        )

        const mint = await getMint(
          connection,
          vaultMint,
          commitmentLevel,
          TOKEN_PROGRAM_ID
        )
        const tokenDepositor = await getOrCreateAssociatedTokenAccount(
          workspace.value,
          wallet.publicKey,
          mint
        )
        const tx = await program.methods
          .withdraw(amount)
          .accounts({
            depositor: wallet.publicKey,
            pool: poolPubKey,
            poolPda: poolPDA,
            tokenDepositor: tokenDepositor.address,
            poolVault: poolVaultPubkey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc()

        console.log(tx)
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("tx", err)
      }
    }
  }

  const onDeposit = async (
    poolPubKey: PublicKey,
    vaultAccount: PublicKey,
    vaultMint: PublicKey
  ) => {
    showModal()
    try {
      poolSelectedRef.current = {
        poolPubKey,
        vaultAccount,
        vaultMint,
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("On Deposit", err)
      }
    }
  }

  const onClose = async (poolPubKey: PublicKey) => {
    try {
      if (workspace.value) {
        const { program, wallet } = workspace.value
        const tx = await program.methods
          .closePool()
          .accounts({
            pool: poolPubKey,
            owner: wallet.publicKey,
          })
          .rpc()
        console.log(tx)
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("On Close", err)
      }
    }
  }

  useAsyncEffect(async () => {
    setLoading(true)
    try {
      if (workspace.value) {
        const { connection, client, wallet } = workspace.value
        const pools = await client.from("Pool").offset(0).limit(10).select()

        const rawData: DataType[] = pools.map(({ publicKey, account }) => {
          return {
            key: publicKey.toBase58(),
            owner: account.owner,
            isAdmin: account.owner.toBase58() === wallet.publicKey.toBase58(),
            vaultMint: account.vaultMint,
            vaultAccount: account.vaultAccount,
            collateralMint: account.collateralMint,
            availableAmount: "0",
            minLoanAmount: formatUnits(
              account.minLoanAmount.toString(),
              decimals
            ),
            status: account.status,
            maxLoanAmount: formatUnits(
              account.maxLoanAmount.toString(),
              decimals
            ),
            loanTerm: account.loanTerm,
            interestRate: formatUnits(account.interestRate.toString(), 4),
            maxLoanThreshold: formatUnits(
              account.maxLoanThreshold.toString(),
              4
            ),
            onDeposit: () =>
              onDeposit(publicKey, account.vaultAccount, account.vaultMint),
            onClose: () => onClose(publicKey),
            onShow: () =>
              router.push(`/lender/pool?id=${publicKey.toBase58()}`),
            onWithdraw: (amount: BN) =>
              onWithdraw(
                publicKey,
                account.vaultAccount,
                account.vaultMint,
                account.collateralMint,
                amount
              ),
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
        }, {} as Record<string, DataType>)

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
          [[], []] as [DataType[], DataType[]]
        )

        setMyPools(data[0])
        setAllPools(data[1])
      }
      setLoading(false)
    } catch (err) {
      if (err instanceof Error) {
        catchError("Set My Pools", err)
        setLoading(false)
      }
    }
  }, [workspace.value, _])

  const handleSubmit = async (props: { depositAmount: number }) => {
    const { depositAmount } = props
    const { poolPubKey, vaultAccount, vaultMint } = poolSelectedRef.current
    try {
      if (workspace.value) {
        const { program, wallet, connection } = workspace.value

        const depositTopUpAmount = new anchor.BN(depositAmount * 10 ** 9)
        const depositLoanFee = depositTopUpAmount
          .div(new BN(10 ** 9))
          .mul(new BN(1_000_000))
        const poolVaultAccount = await getAccount(connection, vaultAccount)
        const vaultMintAddress = await getMint(
          connection,
          vaultMint,
          commitmentLevel,
          TOKEN_PROGRAM_ID
        )
        const associatedTokenVault = await getAssociatedTokenAddress(
          vaultMintAddress.address,
          wallet.publicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
        const accountVault = await getAccount(
          connection,
          associatedTokenVault,
          commitmentLevel
        )
        await program.methods
          .deposit(depositTopUpAmount, depositLoanFee)
          .accounts({
            depositor: wallet.publicKey,
            pool: poolPubKey,
            loanVault: poolVaultAccount.address,
            tokenDepositor: accountVault.address,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc()
        triggerReload((state) => !state)
        handleCancel()
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("Handle Submit", err)
      }
    }
  }

  const showModal = () => {
    setOpen(true)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <div className="px-6 mt-5">
      <div className="flex justify-between items-center max-w-screen-2xl mx-auto mb-5">
        <Title level={2}>Lending</Title>
        <div className="h-full">
          <button
            className="bg-indigo-500 text-white p-3 rounded-md w-36 text-center hover:bg-slate-800 ml-5"
            onClick={() => router.push("/lender/add")}
          >
            Create Pool
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between max-w-screen-2xl mx-auto items-center mb-3">
          <Title level={3}>
            {tabs === "loan" ? "Your Loans" : "Available Pools"}
          </Title>
          <Segmented
            className="bg-indigo-500 text-white selection:bg-amber-400 hover:text-white my-5"
            size="large"
            options={[
              {
                label: "Your Pools",
                value: "myPools",
              },
              { label: "All Pools", value: "allPools" },
            ]}
            onChange={(v) => setTabs(v as string)}
          />
        </div>
        <Row>
          <Col span={24}>
            <Table
              columns={columns}
              loading={loading}
              pagination={false}
              dataSource={tabs === "myPools" ? myPools : allPools}
            />
          </Col>
        </Row>
        <Modal
          title="Title"
          open={open}
          onOk={() => form.submit()}
          onCancel={handleCancel}
          okButtonProps={{ className: "bg-indigo-500" }}
        >
          <Row>
            <Col span={24}>
              <Form
                layout="vertical"
                form={form}
                name="control-hooks"
                onFinish={handleSubmit}
              >
                <Form.Item
                  name="depositAmount"
                  label="Deposit Amount"
                  rules={[{ required: true }]}
                >
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
              </Form>
            </Col>
          </Row>
        </Modal>
      </div>
    </div>
  )
}

export default LenderPage
