import React, { useCallback, useMemo, useRef, useState } from "react"
import {
  Button,
  Col,
  Form,
  FormRule,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Tooltip,
} from "antd"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import { BN, web3 } from "@project-serum/anchor"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import {
  DEFAULT_DECIMALS,
  DEFAULT_PERCENTAGE_DECIMALS,
  SYSTEM_LOAN_COMMISSION_FEE,
  SystemFeeUSDTPubKey,
  USDCPubKey,
  USDTPubKey,
} from "@/common/constants"
import { useGetMint } from "@/hooks/useGetMint"
import { useAccount } from "@/hooks/useAccount"
import { useFormatUnit } from "@/hooks/useFormatUnit"
import { useRouter } from "next/router"
import { catchError } from "@/helps/notification"
import { LOAN_TERMS, LoanTerm } from "@/helps/coverMonth"

const { Option } = Select

const AddPool: React.FC = () => {
  const [form] = Form.useForm()
  const workspace = useWorkspace()
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint)
  const usdtAccount = useAccount(workspace, usdtMint)
  const topUpAmount = Form.useWatch("topUpAmount", form)
  const vaultMint = Form.useWatch("vaultMint", form)
  const loanTerm = Form.useWatch<LoanTerm>("loanTerm", form)
  const interestRate = Form.useWatch("interestRate", form)
  const usdcBalance = useFormatUnit(usdcAccount.value?.amount)
  const usdtBalance = useFormatUnit(usdtAccount.value?.amount)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const router = useRouter()
  const vaultTokenSelectedRef = useRef<any>(null)
  const collateralTokenSelectedRef = useRef<any>(null)

  const estimatedLoanCommissionFee = useMemo(() => {
    return ((topUpAmount || 0) / DEFAULT_DECIMALS) * SYSTEM_LOAN_COMMISSION_FEE
  }, [topUpAmount])

  const totalTopUpAmount = useMemo(
    () => estimatedLoanCommissionFee + (topUpAmount || 0),
    [estimatedLoanCommissionFee, topUpAmount]
  )

  const loanOfTerm = useMemo(() => LOAN_TERMS[loanTerm], [loanTerm])

  const interestIncome = useMemo(() => {
    if (loanOfTerm === 0 || !interestRate) return 0
    return loanOfTerm * interestRate
  }, [loanOfTerm, interestRate])

  const currentBalance: number = useMemo(() => {
    switch (vaultMint) {
      case "usdt":
        vaultTokenSelectedRef.current = usdtMint
        collateralTokenSelectedRef.current = usdcMint
        return parseFloat(usdtBalance)
      case "usdc":
        vaultTokenSelectedRef.current = usdcMint
        collateralTokenSelectedRef.current = usdtMint
        return parseFloat(usdcBalance)
      default:
        return 0
    }
  }, [vaultMint, usdtBalance, usdcBalance, usdtMint, usdcMint])

  const validateRules = useCallback(
    (key: string): FormRule[] | undefined => {
      const rulesMap = new Map<string, FormRule[]>([
        [
          "topUpAmount",
          [
            {
              required: true,
              type: "number",
              message: "Please type numeric values",
            },
            {
              type: "number",
              max: currentBalance,
              message: "You don't enough token",
            },
            { type: "number", min: 100, message: "min value is 100" },
          ],
        ],
        [
          "interestRate",
          [
            {
              required: true,
              type: "number",
              message: "Please type numeric values",
            },
            {
              type: "number",
              max: 100,
              message: "You can't set Interest Rate bigger than 100",
            },
            {
              type: "number",
              min: 0.001,
              message: "You can't set Interest Rate smaller than 0.001",
            },
          ],
        ],
        [
          "maxLoanAmount",
          [
            {
              required: true,
              type: "number",
              message: "Please type numeric values",
            },
            {
              type: "number",
              max: topUpAmount,
              message: `You can't set Max Loan Amount bigger than ${topUpAmount}`,
            },
            {
              type: "number",
              min: 2,
              message: "You can't set Max Loan Amount smaller than 2",
            },
          ],
        ],
        [
          "minLoanAmount",
          [
            {
              required: true,
              type: "number",
              message: "Please type numeric values",
            },
            {
              type: "number",
              max: topUpAmount,
              message: ` You can't set Min Loan Amount bigger than ${topUpAmount}`,
            },
            {
              type: "number",
              min: 1,
              message: "You can't set Min Loan Amount smaller than 1",
            },
          ],
        ],
        [
          "maxLoanThreshold",
          [
            {
              required: true,
              type: "number",
              message: "Please type numeric values",
            },
            {
              type: "number",
              max: 90,
              message: "You can't set Max Loan Threshold bigger than 90",
            },
            {
              type: "number",
              min: 10,
              message: "You can't set Max LoanThreshold smaller than 10",
            },
          ],
        ],
      ])
      return rulesMap.get(key)
    },
    [currentBalance, topUpAmount]
  )

  const onSubmit = async () => {
    setIsOpen(false)
    vaultTokenSelectedRef.current
    collateralTokenSelectedRef.current

    try {
      if (
        workspace.value &&
        vaultTokenSelectedRef.current.value &&
        collateralTokenSelectedRef.current.value
      ) {
        const { wallet, program, connection } = workspace.value

        const [poolPDA] = await PublicKey.findProgramAddress(
          [
            Buffer.from("pool"),
            wallet.publicKey.toBuffer(),
            collateralTokenSelectedRef.current.value.address.toBuffer(),
            vaultTokenSelectedRef.current.value.address.toBuffer(),
          ],
          program.programId
        )

        try {
          const vaultAssociatedAccount = await getAssociatedTokenAddress(
            vaultTokenSelectedRef.current.value.address,
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

          const vaultKeypair = web3.Keypair.generate()
          const pool = web3.Keypair.generate()
          const ins = await program.account.pool.createInstruction(pool)
          await program.methods
            .initPool(
              {
                interestRate: new BN(
                  form.getFieldValue("interestRate") *
                    DEFAULT_PERCENTAGE_DECIMALS
                ),
                maxLoanAmount: new BN(
                  form.getFieldValue("maxLoanAmount") * DEFAULT_DECIMALS
                ),
                minLoanAmount: new BN(
                  form.getFieldValue("minLoanAmount") * DEFAULT_DECIMALS
                ),
                maxLoanThreshold: new BN(
                  form.getFieldValue("maxLoanThreshold") *
                    DEFAULT_PERCENTAGE_DECIMALS
                ),
              },
              new BN(topUpAmount * DEFAULT_DECIMALS),
              new BN(Math.ceil(estimatedLoanCommissionFee) * DEFAULT_DECIMALS),
              {
                [form.getFieldValue("loanTerm")]: {},
              }
            )
            .accounts({
              pool: pool.publicKey,
              poolPda: poolPDA,
              systemProgram: SystemProgram.programId,
              vaultMint: vaultTokenSelectedRef.current.value.address,
              vaultAccount: vaultKeypair.publicKey,
              collateralMint: collateralTokenSelectedRef.current.value.address,
              depositor: wallet.publicKey,
              systemFeeAccount: SystemFeeUSDTPubKey,
              tokenDepositor: walletVaultAccount.address,
              tokenProgram: TOKEN_PROGRAM_ID,
              rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .preInstructions([ins])
            .signers([pool, vaultKeypair])
            .rpc()
          await router.push("/lender")
        } catch (e) {
          throw e
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("On Submit", err)
      }
    }
  }

  const onFill = () => {
    form.setFieldsValue({
      vaultMint: "usdt",
      collateralMint: "usdc",
      topUpAmount: 100,
      loanTerm: "twelveMonths",
      interestRate: 10,
      maxLoanAmount: 100,
      minLoanAmount: 10,
      maxLoanThreshold: 80,
    })
  }

  return (
    <div className="mx-auto w-[600px] mt-5 px-20 py-10 shadow-lg">
      <h1 className="font-bold my-5 text-center text-3xl">Create Pool</h1>
      <Row>
        <Col span={24}>
          <Form
            layout="vertical"
            form={form}
            name="control-hooks"
            onFinish={() => setIsOpen(true)}
          >
            <Form.Item
              name="vaultMint"
              label="Loan Currency"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select a option and change input text above"
                allowClear
              >
                <Option value="usdt">{`USDT __ (${usdtBalance})`}</Option>
                <Option value="usdc">{`USDC __ (${usdcBalance})`}</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="collateralMint"
              label="Collateral Currency"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select a option and change input text above"
                allowClear
              >
                <Option value="usdt">USDT</Option>
                <Option value="usdc">USDC</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="topUpAmount"
              label="Total Supply"
              rules={validateRules("topUpAmount")}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <div className="flex justify-between">
              <Form.Item label="Estimated Transaction Fee">
                <span className="ant-form-text">
                  {estimatedLoanCommissionFee.toFixed(2)}{" "}
                  {vaultMint?.toUpperCase()}
                </span>
              </Form.Item>

              <Form.Item label="Total Payment">
                <span className="ant-form-text">
                  {totalTopUpAmount.toFixed(2)} {vaultMint?.toUpperCase()}
                </span>
              </Form.Item>
            </div>

            <Form.Item
              name="loanTerm"
              label="Loan Term"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select a option and change input text above"
                allowClear
              >
                <Option value="twoMinutes">2 Minutes (12 months) - Test</Option>
                <Option value="oneMonth">1 Month</Option>
                <Option value="threeMonths">3 Months</Option>
                <Option value="sixMonths">6 Months</Option>
                <Option value="nineMonths">9 Months</Option>
                <Option value="twelveMonths">12 Months</Option>
              </Select>
            </Form.Item>
            <div className="flex justify-between items-center">
              <Form.Item
                className="w-[200px]"
                name="interestRate"
                label="Interest Rate"
                rules={validateRules("interestRate")}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <div className="w-[110px]">
                <h3>Interest Income</h3>
                <p>{interestIncome.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <Form.Item
                className="w-[200px]"
                name="maxLoanAmount"
                label="Maximum Loan Amount"
                rules={validateRules("maxLoanAmount")}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                className="w-[200px]"
                name="minLoanAmount"
                label="Minimum Loan Amount"
                rules={validateRules("minLoanAmount")}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </div>

            <Form.Item
              name="maxLoanThreshold"
              label={
                <Tooltip title="Maximum Loan-To-Value Ratio">
                  <span>{"LTV Ratio"}</span>
                </Tooltip>
              }
              rules={validateRules("maxLoanThreshold")}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  className="bg-indigo-500"
                  type="primary"
                  htmlType="submit"
                >
                  Submit
                </Button>

                <Button type="default" onClick={onFill}>
                  Autofill
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Col>
      </Row>
      <Modal
        title="Pool details"
        open={isOpen}
        width={600}
        okButtonProps={{ className: "bg-indigo-500" }}
        onOk={onSubmit}
        onCancel={() => setIsOpen(false)}
      >
        <div className="flex justify-between mb-4 px-5 mt-7">
          <div className="flex justify-between border-b w-56">
            <h4 className="font-medium">Loan Currency</h4>
            <p>{vaultMint?.toUpperCase()}</p>
          </div>
          <div className="flex justify-between border-b w-56">
            <h4 className="font-medium">Collateral Currency</h4>
            <p>{form.getFieldValue("collateralMint")?.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex justify-between mb-4 px-5">
          <div className="flex justify-between border-b w-56">
            <h4 className="font-medium">Top Supply</h4>
            <p>{form.getFieldValue("topUpAmount")}</p>
          </div>
          <div className="flex justify-between border-b w-56">
            <h4 className="font-medium">Total Payment</h4>
            <p>{totalTopUpAmount.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex justify-between mb-4 px-5">
          <div className="flex justify-between border-b w-56">
            <h4 className="font-medium">Loan Term</h4>
            <p>{`${loanOfTerm} `}</p>
          </div>
          <div className="flex justify-between border-b w-56">
            <h4 className="font-medium">Interest Rate</h4>
            <p>{`${interestRate} %`}</p>
          </div>
        </div>
        <div className="flex justify-between mb-4 px-5">
          <div className="flex justify-between border-b w-56">
            <h4 className="font-medium">Interest Income</h4>
            <p>{interestIncome}</p>
          </div>
          <div className="flex justify-between border-b w-56">
            <h4 className="font-medium">Max Total Income</h4>
            <p>
              {(form.getFieldValue("maxLoanThreshold") *
                form.getFieldValue("topUpAmount")) /
                100 +
                interestIncome}
            </p>
          </div>
        </div>
        <div className="flex justify-between mb-4 px-5">
          <div className="flex justify-between border-b w-56">
            <h4 className="font-medium">Maximum Loan Amount</h4>
            <p>{form.getFieldValue("maxLoanAmount")}</p>
          </div>
          <div className="flex justify-between border-b w-56">
            <h4 className="font-medium">Minimum Loan Amount</h4>
            <p>{form.getFieldValue("minLoanAmount")}</p>
          </div>
        </div>
        <div className="flex justify-between mb-4 px-5">
          <div className="flex justify-between border-b w-56">
            <Tooltip title="Maximum Loan-To-Value Ratio">
              <h4 className="font-medium">LTV ratio</h4>
            </Tooltip>
            <p>{`${form.getFieldValue("maxLoanThreshold")} %`}</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AddPool
