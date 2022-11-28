import React, { useRef, useState } from "react"
import {
  Button,
  Col,
  Form,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd"
import useIsMounted from "@/hooks/useIsMounted"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import styles from "@/styles/Home.module.css"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import type { ColumnsType } from "antd/es/table"
import {
  SystemFeeUSDTPubKey,
  TOKEN_LISTS,
  USDTPubKey,
} from "@/common/constants"
import { formatUnits } from "@ethersproject/units"
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import { getAccount, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import useAsyncEffect from "use-async-effect"
import { BN, web3 } from "@project-serum/anchor"
import { FormInstance } from "antd/es/form/hooks/useForm"
import { Values } from "async-validator"
import { getOrCreateAssociatedTokenAccount } from "@/services"

const { Title } = Typography
const { Option } = Select

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
          <Button type="primary" onClick={showModal}>
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
  const mounted = useIsMounted()
  const workspace = useWorkspace()
  const [form] = Form.useForm()
  const [availablePools, setAvailablePools] = useState<PoolDataType[]>([])
  const [myLoans, setMyLoans] = useState<LoanDataType[]>([])
  const [open, setOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const formRef = useRef<FormInstance<Values> | null>(null)

  const showModal = () => {
    console.log("zzz")
    setOpen(true)
  }

  const handleOk = async () => {
    if (formRef.current && selectedPool && workspace.value) {
      const loanTerm = formRef.current.getFieldValue("loanTerm")
      const loanAmount = formRef.current?.getFieldValue("loanAmount")

      setConfirmLoading(true)
      const pool = availablePools.find((v) => v.key === selectedPool.toBase58())
      console.log(pool)
      if (pool) {
        const { wallet, connection } = workspace.value
        const depositorMint = await getMint(connection, pool.collateralMint)
        const depositorAccount = await getOrCreateAssociatedTokenAccount(
          workspace.value,
          wallet.publicKey,
          depositorMint
        )

        const receiverMint = await getMint(connection, USDTPubKey)
        const receiverAccount = await getOrCreateAssociatedTokenAccount(
          workspace.value,
          wallet.publicKey,
          receiverMint
        )
        console.log(formatUnits(receiverAccount.amount.toString(), 9))

        await onCreateLoan(
          loanAmount.toString(),
          loanTerm,
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
    amount: string,
    loanTerm: string,
    poolPubkey: PublicKey,
    tokenDepositorPubkey: PublicKey,
    tokenReceiverPubkey: PublicKey
  ) => {
    if (workspace.value) {
      const { wallet, program } = workspace.value
      const poolAccount = await program.account.pool.fetch(poolPubkey)

      const [poolPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("pool"), poolAccount.vaultMint.toBuffer()],
        program.programId
      )

      const loan = web3.Keypair.generate()
      const [loanPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("loan"), poolPubkey.toBuffer()],
        program.programId
      )

      const vaultKeypair = Keypair.generate()
      const collateralAccountKeypair = Keypair.generate()
      const nftMintKeypair = Keypair.generate()
      const nftAccountKeypair = Keypair.generate()
      const ins = await program.account.loan.createInstruction(loan)
      await program.methods
        .initLoan(new BN(100 * 10 ** 9), {
          oneMonth: {},
        })
        .accounts({
          vaultAccount: vaultKeypair.publicKey,
          vaultMint: poolAccount.vaultMint,
          collateralMint: poolAccount.collateralMint,
          collateralAccount: collateralAccountKeypair.publicKey,
          rent: web3.SYSVAR_RENT_PUBKEY,
          nftMint: nftMintKeypair.publicKey,
          nftAccount: nftAccountKeypair.publicKey,
          loan: loan.publicKey,
          pool: poolPubkey,
          poolPda: poolPDA,
          loanPda: loanPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          poolVault: poolAccount.vaultAccount,
          borrower: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          systemFeeAccount: SystemFeeUSDTPubKey,
          tokenDepositor: tokenDepositorPubkey,
          tokenReceiver: tokenReceiverPubkey,
        })
        .preInstructions([ins])
        .signers([
          loan,
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
      const { program, wallet } = workspace.value
      const loans = await program.account.loan.all()
      console.log(loans)
      const rawData: LoanDataType[] = loans.map(({ publicKey, account }) => {
        return {
          key: publicKey.toBase58(),
          owner: account.owner,
          isAdmin: account.owner.toBase58() === wallet.publicKey.toBase58(),
          vaultMint: account.vaultMint,
          vaultAccount: account.vaultAccount,
          collateralMint: account.collateralMint,
          status: Object.keys(account.status)[0],
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

      setMyLoans(data[1])
    }
  }, [workspace.value])

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { connection, program, wallet } = workspace.value
      const pools = await program.account.pool.all()
      console.log(pools)
      const rawData: PoolDataType[] = pools.map(({ publicKey, account }) => {
        return {
          key: publicKey.toBase58(),
          owner: account.owner,
          isAdmin: account.owner.toBase58() === wallet.publicKey.toBase58(),
          vaultMint: account.vaultMint,
          vaultAccount: account.vaultAccount,
          collateralMint: account.collateralMint,
          status: Object.keys(account.status)[0],
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

      setAvailablePools(data[1])
    }
  }, [workspace.value])

  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>
      <Title level={2}>Borrower</Title>

      <div>
        <Title level={3}>Your Loans</Title>
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

      <div>
        <Title level={3}>Available Pools</Title>
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

      <Modal
        title="Title"
        open={open}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
        <Row>
          <Col span={24}>
            <Form
              ref={formRef}
              layout="vertical"
              form={form}
              name="control-hooks"
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
