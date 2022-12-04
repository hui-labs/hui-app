import React, { useState } from "react"
import {
  Button,
  Col,
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
import { getAccount, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import useAsyncEffect from "use-async-effect"
import { BN } from "@project-serum/anchor"
import { getOrCreateAssociatedTokenAccount } from "@/services"

const { Title } = Typography

export interface DataType {
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
  onClose: () => void
  onWithdraw: (amount: BN) => void
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
    render: (_, { onWithdraw, onClose, availableAmount, isAdmin }) => {
      if (isAdmin) {
        return (
          <Space>
            <Button
              onClick={() =>
                onWithdraw(new BN(parseUnits(availableAmount, 9).toString()))
              }
            >
              Withdraw
            </Button>
            <Button danger type="primary" onClick={() => onClose()}>
              Close
            </Button>
          </Space>
        )
      }

      return null
      // return (
      //   <Space>
      //     <Button
      //       type="primary"
      //       onClick={() =>
      //         onWithdraw(new BN(parseUnits(availableAmount, 9).toString()))
      //       }
      //     >
      //       Loan
      //     </Button>
      //   </Space>
      // )
    },
  },
]

const LenderPage: React.FC = () => {
  const router = useRouter()
  const workspace = useWorkspace()
  const [myPools, setMyPools] = useState<DataType[]>([])
  const decimals = 9
  const [tabs, setTabs] = useState<string>("pool")

  const onWithdraw = async (
    poolPubKey: PublicKey,
    poolVaultPubkey: PublicKey,
    mintPubKey: PublicKey,
    amount: BN
  ) => {
    if (workspace.value) {
      const { program, wallet, connection } = workspace.value

      const [poolPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("pool"), mintPubKey.toBuffer()],
        program.programId
      )

      const mint = await getMint(
        connection,
        mintPubKey,
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
      const { connection, program, wallet } = workspace.value
      const pools = await program.account.pool.all()
      const rawData: DataType[] = pools.map(({ publicKey, account }) => {
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
          onClose: () => onClose(publicKey),
          onWithdraw: (amount: BN) =>
            onWithdraw(
              publicKey,
              account.vaultAccount,
              account.vaultMint,
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
    }
  }, [workspace.value])

  const onLoadData = async () => {
    if (workspace.value) {
    }
  }

  return (
    <div className="px-6 mt-5 max-w-screen-lg mx-auto">
      <div className="flex justify-between items-center mb-5">
        <Title level={2}>Lender</Title>
        <div className="h-full">
          <button
            className="bg-indigo-500 text-white p-3 rounded-md w-28 text-center hover:bg-slate-800 ml-5"
            onClick={() => router.push("/lender/add")}
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
                value: "pool",
              },
              { label: "Loan Are Owned", value: "loan" },
            ]}
            onChange={(v) => setTabs(v as string)}
          />
        </div>
        {tabs === "pool" && (
          <Row>
            <Col span={24}>
              <Table
                columns={columns}
                pagination={false}
                onRow={(record) => {
                  return {
                    onClick: async () => {
                      await router.push(`/lender/pool?id=${record.key}`)
                    },
                  }
                }}
                dataSource={myPools}
              />
            </Col>
          </Row>
        )}
      </div>
    </div>
  )
}

export default LenderPage
