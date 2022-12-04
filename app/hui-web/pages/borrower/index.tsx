import React, { useState } from "react"
import {
  Button,
  Col,
  Form,
  InputNumber,
  Modal,
  Row,
  Segmented,
  Select,
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
} from "@/common/constants"
import { formatUnits } from "@ethersproject/units"
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import { getAccount, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import useAsyncEffect from "use-async-effect"
import { BN, web3 } from "@project-serum/anchor"
import { getOrCreateAssociatedTokenAccount } from "@/services"

const { Title } = Typography
const { Option } = Select

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
  showModal: () => void
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
    title: "Action",
    dataIndex: "",
    key: "x",
    render: (_, { showModal }) => {
      return (
        <Space>
          <Button className="bg-indigo-500" type="primary" onClick={showModal}>
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
    title: "loan",
    dataIndex: "receivedAmount",
    key: "receivedAmount",
  },
  {
    title: "Action",
    dataIndex: "",
    key: "x",
    render: (_, {}) => {
      return (
        <Space>
          <Button type="primary">Final</Button>
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

  const showModal = () => {
    setOpen(true)
  }

  const handleSubmit = async (data: LoanForm) => {
    if (data && selectedPool && workspace.value) {
      const loanAmount = data?.loanAmount

      setConfirmLoading(true)
      const pool = availablePools.find((v) => v.key === selectedPool.toBase58())
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
        console.log(formatUnits(receiverAccount.amount.toString(), 9))

        await onCreateLoan(
          loanAmount,
          selectedPool,
          depositorAccount.address,
          receiverAccount.address
        )
      }
      setConfirmLoading(false)
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

      const masterLoan = web3.Keypair.generate()
      const [loanPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("masterLoan"), poolPubkey.toBuffer()],
        program.programId
      )

      const vaultKeypair = Keypair.generate()
      const collateralAccountKeypair = Keypair.generate()
      const nftMintKeypair = Keypair.generate()
      const nftAccountKeypair = Keypair.generate()

      await program.methods
        .initLoan(new BN(amount * DEFAULT_DECIMALS))
        .accounts({
          vaultAccount: vaultKeypair.publicKey,
          vaultMint: poolAccount.vaultMint,
          collateralMint: poolAccount.collateralMint,
          collateralAccount: collateralAccountKeypair.publicKey,
          nftMint: nftMintKeypair.publicKey,
          nftAccount: nftAccountKeypair.publicKey,
          masterLoan: masterLoan.publicKey,
          pool: poolPubkey,
          poolPda: poolPDA,
          loanPda: loanPDA,
          poolVault: poolAccount.vaultAccount,
          borrower: wallet.publicKey,
          systemFeeAccount: SystemFeeUSDTPubKey,

          tokenDepositor: tokenDepositorPubkey,
          tokenReceiver: tokenReceiverPubkey,

          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .preInstructions([
          await program.account.masterLoan.createInstruction(masterLoan),
        ])
        .signers([
          masterLoan,
          nftMintKeypair,
          nftAccountKeypair,
          collateralAccountKeypair,
          vaultKeypair,
        ])
        .rpc()
      console.log("created")
    }
  }
  const [selectedPool, setSelectedPool] = useState<PublicKey | null>(null)

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { wallet, client } = workspace.value
      const loans = await client
        .from("LoanMetadata")
        .offset(0)
        .limit(10)
        .select()

      setTimeout(async () => {
        const loans = await client.select()
        console.log("all loans", loans)
        const rawData: LoanDataType[] = loans.map(({ publicKey, account }) => {
          console.log("all account", account)
          return {
            key: publicKey.toBase58(),
            owner: account.owner,
            isAdmin: account.owner.toBase58() === wallet.publicKey.toBase58(),
            vaultMint: account.vaultMint,
            vaultAccount: account.vaultAccount,
            collateralMint: account.collateralMint,
            status: "",
            minLoanAmount: formatUnits(
              account.minLoanAmount.toString(),
              decimals
            ),
            maxLoanAmount: formatUnits(
              account.maxLoanAmount.toString(),
              decimals
            ),
            // receivedAmount: formatUnits(
            //   account.receivedAmount.toString(),
            //   decimals
            // ),
            interestRate: formatUnits(account.interestRate.toString(), 4),
            maxLoanThreshold: formatUnits(
              account.maxLoanThreshold.toString(),
              4
            ),
          }
        })

        const cache = rawData.reduce((acc, cur) => {
          acc[cur.vaultAccount.toBase58()] = cur
          return acc
        }, {} as Record<string, LoanDataType>)

        const data = Object.values(cache).reduce(
          (acc, cur) => {
            acc[cur.isAdmin ? 0 : 1].push(cur)
            return acc
          },
          [[], []] as [LoanDataType[], LoanDataType[]]
        )
        console.log("all data", data)
        setMyLoans(data[1])
      }, 1000)
    }
  }, [workspace.value])

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { connection, wallet, client } = workspace.value
      const pools = await client.from("Pool").offset(0).limit(10).select()
      console.log("pools", pools)
      const rawData: PoolDataType[] = pools.map(({ publicKey, account }) => {
        return {
          key: publicKey.toBase58(),
          owner: account.owner,
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
          maxLoanThreshold: formatUnits(account.maxLoanThreshold.toString(), 4),
          showModal: () => {
            setSelectedPool(publicKey)
            showModal()
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

      setAvailablePools(data[1]) // mình là nguoi di vay => pool khong phải cua minh => admin = 1
    }
  }, [workspace.value])

  return (
    <div className="px-6 mt-5 max-w-screen-lg mx-auto">
      <Title level={2}>Borrower</Title>
      <div className="flex justify-between items-center mt-10">
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
                expandable={{
                  expandedRowRender: (_) => <p style={{ margin: 0 }}>Hello</p>,
                  // rowExpandable: (record) => record.name !== "Not Expandable",
                }}
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
                expandable={{
                  expandedRowRender: (_) => <p style={{ margin: 0 }}>Hello</p>,
                  // rowExpandable: (record) => record.name !== "Not Expandable",
                }}
                dataSource={availablePools}
              />
            </Col>
          </Row>
        </div>
      )}

      <Modal
        title="Title"
        open={open}
        onOk={() => form.submit()}
        confirmLoading={confirmLoading}
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
                name="loanTerm"
                label="Loan Term"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select a option and change input text above"
                  allowClear
                >
                  <Option value="twoMinutes">2 Minutes - Test</Option>
                  <Option value="oneMonth">1 Month</Option>
                  <Option value="threeMonths">3 Months</Option>
                  <Option value="sixMonths">6 Months</Option>
                  <Option value="nineMonths">9 Months</Option>
                  <Option value="twelveMonths">12 Months</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="loanAmount"
                label="Loan Amount"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Modal>
    </div>
  )
}

export default BorrowerPage
