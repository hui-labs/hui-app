import React, { useCallback, useMemo } from "react"
import {
  Button,
  Col,
  Form,
  FormRule,
  InputNumber,
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
import { SystemFeeUSDTPubKey, USDCPubKey, USDTPubKey } from "@/common/constants"
import { useGetMint } from "@/hooks/useGetMint"
import { useAccount } from "@/hooks/useAccount"
import { useFormatUnit } from "@/hooks/useFormatUnit"

const { Option } = Select

const SYSTEM_LOAN_COMMISSION_FEE = 1_000_000
const DEFAULT_DECIMALS = 10 ** 9
const DEFAULT_PERCENTAGE_DECIMALS = 10 ** 4

const AddPool: React.FC = () => {
  const [form] = Form.useForm()
  const workspace = useWorkspace()
  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint)
  const usdtAccount = useAccount(workspace, usdtMint)
  const topUpAmount = Form.useWatch("topUpAmount", form)
  const vaultMint = Form.useWatch("vaultMint", form)
  const usdcBalance = useFormatUnit(usdcAccount.value?.amount)
  const usdtBalance = useFormatUnit(usdtAccount.value?.amount)

  const estimatedLoanCommissionFee = useMemo(() => {
    return ((topUpAmount || 0) / DEFAULT_DECIMALS) * SYSTEM_LOAN_COMMISSION_FEE
  }, [topUpAmount])

  const totalTopUpAmount = useMemo(
    () => estimatedLoanCommissionFee + (topUpAmount || 0),
    [estimatedLoanCommissionFee, topUpAmount]
  )

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
            { type: "number", min: 0, message: "min value is 0" },
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
              min: 0,
              message: "You can't set Interest Rate smaller than 0",
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
              min: 0,
              message: "You can't set Max Loan Amount smaller than 0",
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
              min: 0,
              message: "You can't set Min Loan Amount smaller than 0",
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
              min: 0,
              message: "You can't set Max LoanThreshold smaller than 0",
            },
          ],
        ],
      ])
      return rulesMap.get(key)
    },
    [currentBalance, topUpAmount]
  )

  const onSubmit = async () => {
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
              maxLoanThreshold: new BN(
                form.getFieldValue("maxLoanThreshold") *
                  DEFAULT_PERCENTAGE_DECIMALS
              ),
              minLoanAmount: new BN(
                form.getFieldValue("minLoanAmount") * DEFAULT_DECIMALS
              ),
            },
            new BN(topUpAmount * DEFAULT_DECIMALS),
            new BN(Math.ceil(estimatedLoanCommissionFee) * DEFAULT_DECIMALS)
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
        console.log(pool.publicKey.toBase58())
        form.resetFields()
      } catch (e) {
        console.log(e)
      }
    }
  }

  const onFill = () => {
    form.setFieldsValue({
      vaultMint: "usdt",
      collateralMint: "usdc",
      topUpAmount: 20,
      interestRate: 10,
      maxLoanAmount: 100,
      minLoanAmount: 50,
      maxLoanThreshold: 80,
    })
  }

  return (
    <div className="mx-auto w-[600px] mt-16 px-20 py-10 shadow-lg">
      <h1 className="font-bold my-5 text-center text-3xl">Create Pool</h1>
      <Row>
        <Col span={24}>
          <Form
            layout="vertical"
            form={form}
            name="control-hooks"
            onFinish={onSubmit}
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
              name="interestRate"
              label="Interest Rate"
              rules={validateRules("interestRate")}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <div className="flex justify-between">
              <Form.Item
                name="maxLoanAmount"
                label="Max Loan Amount"
                rules={validateRules("maxLoanAmount")}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
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
              <InputNumber
                formatter={(value) => `${value}%`}
                style={{ width: "100%" }}
              />
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
    </div>
  )
}

export default AddPool
