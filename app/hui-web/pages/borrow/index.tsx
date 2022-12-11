import React, { useState } from "react"
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
  SystemFeeUSDCPubKey,
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
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { Database } from "@/types/supabase"

const { Title } = Typography

interface LoanForm {
  loanTerm: string
  loanAmount: number
}

interface PoolDataType {
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
  loanTerm: string
  showModal: (data: PoolDataType) => void
}

const poolColumns: ColumnsType<PoolDataType> = [
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
    title: "Loan Term",
    dataIndex: "loanTerm",
    key: "loanTerm",
  },
  {
    title: "Action",
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
  },
  {
    title: "Action",
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
  const usdcAccount = useAccount(workspace, usdcMint, SystemFeeUSDCPubKey)
  const usdtAccount = useAccount(workspace, usdtMint, SystemFeeUSDTPubKey)
  const usdcBalance = useFormatUnit(usdcAccount.value?.amount)
  const usdtBalance = useFormatUnit(usdtAccount.value?.amount)
  const [created, setCreated] = useState<string | null>(null)
  const supabase = useSupabaseClient<Database>()

  const handleSubmit = async (data: LoanForm) => {
    if (data && selectedPool && workspace.value) {
      const loanAmount = data?.loanAmount

      setConfirmLoading(true)
      const pool = availablePools.find((v) => v.key === selectedPool)
      if (pool) {
        const { wallet, connection } = workspace.value
        const depositorMint = await getMint(
          connection,
          new PublicKey(pool.collateralMint)
        )
        const depositorAccount = await getOrCreateAssociatedTokenAccount(
          workspace.value,
          wallet.publicKey,
          depositorMint
        )

        const receiverMint = await getMint(
          connection,
          new PublicKey(pool.vaultMint)
        )
        const receiverAccount = await getOrCreateAssociatedTokenAccount(
          workspace.value,
          wallet.publicKey,
          receiverMint
        )

        const tx = await onCreateLoan(
          loanAmount,
          new PublicKey(selectedPool),
          depositorAccount.address,
          receiverAccount.address
        )

        setOpen(false)
        setCreated(tx)
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

      const masterLoan = Keypair.generate()
      const loanMetadata = Keypair.generate()
      const [loanPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("masterLoan"), poolPubkey.toBuffer()],
        program.programId
      )

      const collateralAccountKeypair = Keypair.generate()
      const nftMintKeypair = Keypair.generate()

      const tx = await program.methods
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

      await supabase.from("master_loans").insert([
        {
          pubkey: masterLoan.publicKey.toBase58(),
          owner: wallet.publicKey.toBase58(),
          amount: amount * DEFAULT_DECIMALS,
          system_fee_account: SystemFeeUSDTPubKey.toBase58(),
          pool: poolPubkey.toBase58(),
          collateral_mint: poolAccount.collateralMint.toBase58(),
          collateral_account: collateralAccountKeypair.publicKey.toBase58(),
          deposit_account: tokenDepositorPubkey.toBase58(),
          withdrawal_account: tokenReceiverPubkey.toBase58(),
          nft_mint: nftMintKeypair.publicKey.toBase58(),
          tx,
        },
      ])

      await supabase.from("metadata").insert([
        {
          pubkey: loanMetadata.publicKey.toBase58(),
          nft_mint: nftMintKeypair.publicKey.toBase58(),
          amount: amount * DEFAULT_DECIMALS,
          master_loan: masterLoan.publicKey.toBase58(),
          is_claimed: false,
          nft_account: null,
          status: "OPENING",
          tx,
          pool: poolPubkey.toBase58(),
        },
      ])

      return tx
    }

    return null
  }
  const [selectedPool, setSelectedPool] = useState<string | null>(null)

  const loanMetadataFetcher = async (client: AnchorClient, loan: any) => {
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
  }

  const onFinal = async (
    masterLoanPubKey: PublicKey,
    poolPubKey: PublicKey,
    vaultMint: PublicKey,
    collateralMint: PublicKey,
    collateralAccount: PublicKey,
    loanMetadata: any
  ) => {
    if (workspace.value) {
      const { program, wallet, client } = workspace.value
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
    }
  }

  // useAsyncEffect(async () => {
  //   if (workspace.value) {
  //     const { wallet, client, program } = workspace.value
  //     const loans = await client.from("MasterLoan").offset(0).limit(10).select()
  //     const loansDetail = await Promise.all(
  //       loans.map((loan) => loanMetadataFetcher(client, loan))
  //     )
  //     console.log("loansDetail", loansDetail)
  //
  //     const rawData: LoanDataType[] = loansDetail
  //       .filter((v) => v.loanMetadata)
  //       .map(({ publicKey, account, loanMetadata }) => {
  //         const status = loanMetadata
  //           ? Object.keys(loanMetadata?.account.status)[0]
  //           : ""
  //         return {
  //           key: publicKey.toBase58(),
  //           owner: account.owner,
  //           isAdmin:
  //             account.borrower.toBase58() === wallet.publicKey.toBase58(),
  //           vaultMint: account.vaultMint,
  //           vaultAccount: account.vaultAccount,
  //           collateralMint: account.collateralMint,
  //           status,
  //           loanTerm: Object.keys(account.loanTerm)[0],
  //           minLoanAmount: formatUnits(
  //             account.minLoanAmount.toString(),
  //             decimals
  //           ),
  //           maxLoanAmount: formatUnits(
  //             account.maxLoanAmount.toString(),
  //             decimals
  //           ),
  //           receivedAmount: formatUnits(
  //             account.receivedAmount.toString(),
  //             decimals
  //           ),
  //           interestRate: formatUnits(account.interestRate.toString(), 4),
  //           maxLoanThreshold: formatUnits(
  //             account.maxLoanThreshold.toString(),
  //             4
  //           ),
  //           onFinal: () =>
  //             onFinal(
  //               publicKey,
  //               account.pool,
  //               account.vaultMint,
  //               account.collateralMint,
  //               account.collateralAccount,
  //               loanMetadata
  //             ),
  //         }
  //       })
  //
  //     // const accounts = await Promise.all(
  //     //   rawData.map((item) =>
  //     //     getAccount(connection, item.vaultAccount, commitmentLevel)
  //     //   )
  //     // )
  //
  //     const cache = rawData.reduce((acc, cur) => {
  //       acc[cur.vaultAccount.toBase58()] = cur
  //       return acc
  //     }, {} as Record<string, LoanDataType>)
  //
  //     // accounts.forEach((account) => {
  //     //   if (account.address.toBase58() in cache) {
  //     //     cache[account.address.toBase58()].availableAmount = formatUnits(
  //     //       account.amount,
  //     //       9
  //     //     )
  //     //   }
  //     // })
  //
  //     const data = Object.values(cache).reduce(
  //       (acc, cur) => {
  //         acc[cur.isAdmin ? 0 : 1].push(cur)
  //         return acc
  //       },
  //       [[], []] as [LoanDataType[], LoanDataType[]]
  //     )
  //
  //     setMyLoans(data[0])
  //   }
  // }, [workspace.value, created])

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { connection, wallet } = workspace.value
      const { data: pools, error } = await supabase
        .from("pools")
        .select()
        .neq("owner", wallet.publicKey.toBase58())

      if (error) throw error

      const rawData: PoolDataType[] = pools.map((pool) => {
        return {
          key: pool.pubkey,
          owner: pool.owner,
          vaultMint: pool.vault_mint,
          vaultAccount: pool.vault_account,
          collateralMint: pool.collateral_mint,
          status: pool.status,
          loanTerm: pool.loan_term,
          availableAmount: "0",
          minLoanAmount: formatUnits(pool.min_loan_amount.toString(), decimals),
          maxLoanAmount: formatUnits(pool.max_loan_amount.toString(), decimals),
          interestRate: formatUnits(pool.interest_rate.toString(), 4),
          maxLoanThreshold: formatUnits(pool.max_loan_threshold.toString(), 4),
          showModal: (data: PoolDataType) => {
            setSelectedPool(pool.pubkey)
            showModal(data)
          },
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
      }, {} as Record<string, PoolDataType>)

      accounts.forEach((account) => {
        if (account.address.toBase58() in cache) {
          cache[account.address.toBase58()].availableAmount = formatUnits(
            account.amount,
            9
          )
        }
      })

      setAvailablePools(rawData)
    }
  }, [workspace.value, created])

  const showModal = (data: PoolDataType) => {
    setPoolDetails(data)
    setOpen(true)
  }

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
                <p>{TOKEN_LISTS[poolDetails.vaultMint]}</p>
              </div>
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Collateral Token</h4>
                <p>{TOKEN_LISTS[poolDetails.collateralMint]}</p>
              </div>
            </div>
            <div className="flex justify-between mb-4 px-5">
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Top Up Amount</h4>
                <p>{poolDetails.availableAmount}</p>
              </div>
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Interest Rate/Month</h4>
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
                {/*waiting for BE , hardcode 6 month*/}
                <p>{6}</p>
              </div>
            </div>
            <div className="flex justify-between mb-4 px-5">
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Collateral Amount</h4>
                {/*formula is loanAmount / maxLoanThreshold * 100 */}
                <p>
                  {loanAmount
                    ? (loanAmount * 100) /
                      parseInt(poolDetails.maxLoanThreshold)
                    : 0}
                </p>
              </div>
              <div className="flex justify-between border-b w-56">
                <h4 className="font-medium">Pay</h4>
                {/*formula is loanAmount + loanAmount / interestRate * loanTerm (here is 6 month)*/}
                <p>
                  {loanAmount
                    ? loanAmount +
                      (loanAmount / parseInt(poolDetails.interestRate)) * 6
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
                    // {
                    //   type: "number",
                    //   max: showAvailableCollateral,
                    //   message: "not enough Collateral",
                    // },
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
