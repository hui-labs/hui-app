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
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { Database } from "@/types/supabase"

const { Title } = Typography

interface DataType {
  key: React.Key
  owner: string
  vaultMint: string
  vaultAccount: string
  collateralMint: string
  availableAmount: string
  interestRate: string
  maxLoanAmount: string
  minLoanAmount: string
  maxLoanThreshold: string
  status: string
  onClose: () => void
  onShow: () => void
  onWithdraw: (amount: BN) => void
  onDeposit: () => void
}

const columns: ColumnsType<DataType> = [
  {
    title: "Vault Token",
    dataIndex: "vaultMint",
    key: "vaultMint",
    render: (_, { vaultMint }) => {
      return <span>{TOKEN_LISTS[vaultMint]}</span>
    },
  },
  {
    title: "Collateral Token",
    dataIndex: "collateralMint",
    key: "collateralMint",
    render: (_, { collateralMint }) => {
      return <span>{TOKEN_LISTS[collateralMint]}</span>
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
    title: "Action",
    render: (
      _,
      { onWithdraw, onClose, onShow, onDeposit, availableAmount }
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
  const supabase = useSupabaseClient<Database>()

  const onWithdraw = async (
    poolPubKey: PublicKey,
    poolVaultPubkey: PublicKey,
    vaultMint: PublicKey,
    collateralMint: PublicKey,
    amount: BN
  ) => {
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
  }

  const onDeposit = async (
    poolPubKey: PublicKey,
    vaultAccount: PublicKey,
    vaultMint: PublicKey
  ) => {
    poolSelectedRef.current = {
      poolPubKey,
      vaultAccount,
      vaultMint,
    }
    showModal()
  }

  const onClose = async (poolPubKey: PublicKey) => {
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
  }

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { connection, wallet } = workspace.value
      const { data: pools, error } = await supabase
        .from("pools")
        .select("*")
        .eq("owner", wallet.publicKey.toBase58())

      if (error) throw error

      const rawData: DataType[] = pools.map((pool) => {
        return {
          key: pool.pubkey,
          owner: pool.owner,
          vaultMint: pool.vault_mint,
          vaultAccount: pool.vault_account,
          collateralMint: pool.collateral_mint,
          status: pool.status,
          availableAmount: "0",
          minLoanAmount: formatUnits(pool.min_loan_amount.toString(), decimals),
          maxLoanAmount: formatUnits(pool.max_loan_amount.toString(), decimals),
          interestRate: formatUnits(pool.interest_rate.toString(), 4),
          maxLoanThreshold: formatUnits(pool.max_loan_threshold.toString(), 4),
          onDeposit: () =>
            onDeposit(
              new PublicKey(pool.pubkey),
              new PublicKey(pool.vault_account),
              new PublicKey(pool.vault_mint)
            ),
          onClose: () => onClose(new PublicKey(pool.pubkey)),
          onShow: () => router.push(`/lend/${pool.pubkey}`),
          onWithdraw: (amount: BN) =>
            onWithdraw(
              new PublicKey(pool.pubkey),
              new PublicKey(pool.vault_account),
              new PublicKey(pool.vault_mint),
              new PublicKey(pool.collateral_mint),
              amount
            ),
        }
      })

      const accounts = await Promise.all(
        rawData.map((item) =>
          getAccount(
            connection,
            new PublicKey(item.vaultAccount),
            commitmentLevel
          )
        )
      )

      const cache = rawData.reduce((acc, cur) => {
        acc[cur.vaultAccount] = cur
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

      setMyPools(rawData)
    }
  }, [workspace.value, _])

  const handleSubmit = async (props: { depositAmount: number }) => {
    const { depositAmount } = props
    const { poolPubKey, vaultAccount, vaultMint } = poolSelectedRef.current
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
  }

  const showModal = () => {
    setOpen(true)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <div className="px-6 mt-5 max-w-screen-lg mx-auto">
      <div className="flex justify-between items-center mb-5">
        <Title level={2}>Lender</Title>
        <div className="h-full">
          <button
            className="bg-indigo-500 text-white p-3 rounded-md w-28 text-center hover:bg-slate-800 ml-5"
            onClick={() => router.push("/lend/add")}
          >
            Create Pool
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
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
