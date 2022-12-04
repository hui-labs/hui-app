import React, { useCallback, useMemo, useState } from "react"
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

const { Option } = Select

const LOAN_TERMS = {
  twoMinutes: 12,
  oneMonth: 1,
  threeMonths: 3,
  sixMonths: 6,
  nineMonths: 9,
  twelveMonths: 12,
}
type LoanTerm = keyof typeof LOAN_TERMS

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
        return parseFloat(usdtBalance)
      case "usdc":
        return parseFloat(usdcBalance)
      default:
        return 0
    }
  }, [vaultMint, usdtBalance, usdcBalance])

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
    if (workspace.value && usdtMint.value && usdcMint.value) {
      const { wallet, program, connection } = workspace.value

      const [poolPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("pool"),
          wallet.publicKey.toBuffer(),
          usdcMint.value.address.toBuffer(),
          usdtMint.value.address.toBuffer(),
        ],
        program.programId
      )

      try {
        const usdtAssociatedAccount = await getAssociatedTokenAddress(
          usdtMint.value.address,
          wallet.publicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )

        const walletUsdtAccount = await getAccount(
          connection,
          usdtAssociatedAccount,
          commitmentLevel
        )

        const vaultKeypair = web3.Keypair.generate()
        const pool = web3.Keypair.generate()
        const ins = await program.account.pool.createInstruction(pool)
        await program.methods
          .initPool(
            {
              interestRate: new BN(
                form.getFieldValue("interestRate") * DEFAULT_PERCENTAGE_DECIMALS
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
            vaultMint: usdtMint.value.address,
            vaultAccount: vaultKeypair.publicKey,
            collateralMint: usdcMint.value.address,
            depositor: wallet.publicKey,
            systemFeeAccount: SystemFeeUSDTPubKey,
            tokenDepositor: walletUsdtAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: web3.SYSVAR_RENT_PUBKEY,
          })
          .preInstructions([ins])
          .signers([pool, vaultKeypair])
          .rpc()
        await router.push("/lender")
      } catch (e) {
        console.log(e)
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
              label="Vault Token"
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
              label="Collateral Mint"
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
              label="Top Up Amount"
              rules={validateRules("topUpAmount")}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <div className="flex justify-between">
              <Form.Item label="Estimated Loan Fee">
                <span className="ant-form-text">
                  {estimatedLoanCommissionFee.toFixed(2)}{" "}
                  {vaultMint?.toUpperCase()}
                </span>
              </Form.Item>

              <Form.Item label="Total Top Up Amount">
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
                label="Max Loan Amount"
                rules={validateRules("maxLoanAmount")}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                className="w-[200px]"
                name="minLoanAmount"
                label="Min Loan Amount"
                rules={validateRules("minLoanAmount")}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </div>

            <Form.Item
              name="maxLoanThreshold"
              label="Max Loan Threshold"
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
                  Fill
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Col>
      </Row>
      <Modal
        title="Pool details"
        open={isOpen}
        width={500}
        okButtonProps={{ className: "bg-indigo-500" }}
        onOk={onSubmit}
        onCancel={() => setIsOpen(false)}
      >
        <div className="flex justify-between mb-4 px-5 mt-7">
          <div className="flex justify-between border-b w-48">
            <h4 className="font-medium">Vault Token</h4>
            <p>{vaultMint?.toUpperCase()}</p>
          </div>
          <div className="flex justify-between border-b w-48">
            <h4 className="font-medium">Collateral Token</h4>
            <p>{form.getFieldValue("collateralMint")?.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex justify-between mb-4 px-5">
          <div className="flex justify-between border-b w-48">
            <h4 className="font-medium">Top Up Amount</h4>
            <p>{form.getFieldValue("topUpAmount")}</p>
          </div>
          <div className="flex justify-between border-b w-48">
            <h4 className="font-medium">Total & Fee</h4>
            <p>{totalTopUpAmount.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex justify-between mb-4 px-5">
          <div className="flex justify-between border-b w-48">
            <h4 className="font-medium">Loan Term</h4>
            <p>{loanOfTerm}</p>
          </div>
          <div className="flex justify-between border-b w-48">
            <h4 className="font-medium">Interest Rate</h4>
            <p>{`${interestRate} %`}</p>
          </div>
        </div>
        <div className="flex justify-between mb-4 px-5">
          <div className="flex justify-between border-b w-48">
            <h4 className="font-medium">Interest Income</h4>
            <p>{interestIncome}</p>
          </div>
          <div className="flex justify-between border-b w-48">
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
          <div className="flex justify-between border-b w-48">
            <h4 className="font-medium">Max Loan Amount</h4>
            <p>{form.getFieldValue("maxLoanAmount")}</p>
          </div>
          <div className="flex justify-between border-b w-48">
            <h4 className="font-medium">Min Loan Amount</h4>
            <p>{form.getFieldValue("minLoanAmount")}</p>
          </div>
        </div>
        <div className="flex justify-between mb-4 px-5">
          <div className="flex justify-between border-b w-48">
            <h4 className="font-medium">Max Loan Threshold</h4>
            <p>{`${form.getFieldValue("maxLoanThreshold")} %`}</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AddPool
