import React, { useState } from "react"
import { Button, Col, Row, Space, Table, Tag } from "antd"
import { useRouter } from "next/router"
import useIsMounted from "@/hooks/useIsMounted"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import styles from "@/styles/Home.module.css"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import type { ColumnsType } from "antd/es/table"
import { TOKEN_LISTS } from "@/common/constants"
import { formatUnits } from "@ethersproject/units"
import { PublicKey } from "@solana/web3.js"
import { getAccount } from "@solana/spl-token"
import useAsyncEffect from "use-async-effect"

interface DataType {
  key: React.Key
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
    render: () => <a>Loan</a>,
  },
]

const LenderPage: React.FC = () => {
  const router = useRouter()
  const mounted = useIsMounted()
  const workspace = useWorkspace()
  const [data, setData] = useState<DataType[]>([])
  const decimals = 9

  const loadData = async () => {
    if (workspace.value) {
      setData(data)
    }
  }

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { connection, program } = workspace.value
      const pools = await program.account.pool.all()
      const data: DataType[] = pools.map(({ publicKey, account }) => {
        return {
          key: publicKey.toBase58(),
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
          interestRate: formatUnits(account.interestRate.toString(), decimals),
          maxLoanThreshold: formatUnits(
            account.maxLoanThreshold.toString(),
            decimals
          ),
        }
      })

      const accounts = await Promise.all(
        data.map((item) =>
          getAccount(connection, item.vaultAccount, commitmentLevel)
        )
      )

      const cache = data.reduce((acc, cur) => {
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

      setData(Object.values(cache))
    }
  }, [workspace.value])

  return (
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>
      <Space wrap>
        <Button type="primary" onClick={() => router.push("/lender/add")}>
          Create Loan
        </Button>
        <Button type="primary" onClick={loadData}>
          Load
        </Button>
      </Space>
      <Row>
        <Col span={24}>
          <Table
            columns={columns}
            pagination={false}
            expandable={{
              expandedRowRender: (_) => <p style={{ margin: 0 }}>Hello</p>,
              // rowExpandable: (record) => record.name !== "Not Expandable",
            }}
            dataSource={data}
          />
        </Col>
      </Row>
    </div>
  )
}

export default LenderPage
