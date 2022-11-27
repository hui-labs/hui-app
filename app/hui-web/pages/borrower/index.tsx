import React, { useState } from "react"
import { Button, Col, Row, Space, Table, Tag, Typography } from "antd"
import { useRouter } from "next/router"
import useIsMounted from "@/hooks/useIsMounted"
import { commitmentLevel, programId, useWorkspace } from "@/hooks/useWorkspace"
import styles from "@/styles/Home.module.css"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import type { ColumnsType } from "antd/es/table"
import { TOKEN_LISTS } from "@/common/constants"
import { formatUnits, parseUnits } from "@ethersproject/units"
import { PublicKey } from "@solana/web3.js"
import { getAccount, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import useAsyncEffect from "use-async-effect"
import { BN } from "@project-serum/anchor"
import { getOrCreateAssociatedTokenAccount } from "@/services"
import bs58 from "bs58"
import { sha256 } from "js-sha256"

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
    render: (_, {}) => {
      return (
        <Space>
          <Button type="primary">Loan</Button>
        </Space>
      )
    },
  },
]

const BorrowerPage: React.FC = () => {
  const mounted = useIsMounted()
  const workspace = useWorkspace()
  const [availablePools, setAvailablePools] = useState<DataType[]>([])
  const decimals = 9

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { connection, program, wallet } = workspace.value
      const pools = await program.account.pool.all()
      console.log(pools)
      const rawData: DataType[] = pools.map(({ publicKey, account }) => {
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

      setAvailablePools(data[1])
    }
  }, [workspace.value])

  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>
      <Title level={2}>Borrower</Title>

      <div>
        <Title level={3}>Available Pools</Title>
        <Row>
          <Col span={24}>
            <Table
              columns={columns}
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
    </div>
  )
}

export default BorrowerPage
