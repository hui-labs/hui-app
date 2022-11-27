import React, { useMemo } from "react"
import { Button, Col, Form, InputNumber, Row, Select, Space } from "antd"
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
import styles from "@/styles/Home.module.css"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import useIsMounted from "@/hooks/useIsMounted"

const { Option } = Select

const AddPool: React.FC = () => {
  const mounted = useIsMounted()
  const [form] = Form.useForm()
  const workspace = useWorkspace()

  const usdcMint = useGetMint(workspace, USDCPubKey)
  const usdtMint = useGetMint(workspace, USDTPubKey)
  const usdcAccount = useAccount(workspace, usdcMint)
  const usdtAccount = useAccount(workspace, usdtMint)
  const topUpAmount = Form.useWatch("topUpAmount", form)
  const vaultMint = Form.useWatch("vaultMint", form)

  const estimatedLoanFee = useMemo(() => {
    const SYSTEM_LOAN_FEE = 1_000_000
    return ((topUpAmount || 0) / 10 ** 9) * SYSTEM_LOAN_FEE
  }, [topUpAmount])
  const totalTopUpAmount = useMemo(
    () => estimatedLoanFee + (topUpAmount || 0),
    [estimatedLoanFee, topUpAmount]
  )

  const onSubmit = async () => {
    if (workspace.value && usdtMint.value && usdcMint.value) {
      const { wallet, program, connection } = workspace.value

      const [poolPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("pool"), usdtMint.value.address.toBuffer()],
        program.programId
      )

      try {
        const DECIMALS = 10 ** 9
        const PERCENTAGE_DECIMALS = 10 ** 4

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
                form.getFieldValue("interestRate") * PERCENTAGE_DECIMALS
              ),
              maxLoanAmount: new BN(
                form.getFieldValue("maxLoanAmount") * DECIMALS
              ),
              maxLoanThreshold: new BN(
                form.getFieldValue("maxLoanThreshold") * PERCENTAGE_DECIMALS
              ),
              minLoanAmount: new BN(
                form.getFieldValue("minLoanAmount") * DECIMALS
              ),
            },
            new BN(topUpAmount * DECIMALS),
            new BN(estimatedLoanFee * DECIMALS)
          )
          .accounts({
            pool: pool.publicKey,
            pda: poolPDA,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            vaultMint: usdtMint.value.address,
            collateralMint: usdcMint.value.address,
            vaultAccount: vaultKeypair.publicKey,
            depositor: wallet.publicKey,
            systemFeeAccount: SystemFeeUSDTPubKey,
            tokenDepositor: walletUsdtAccount.address,
            tokenProgram: TOKEN_PROGRAM_ID,
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
    <div>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>
      <Row>
        <Col span={6}>
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
                <Option value="usdt">USDT</Option>
                <Option value="usdc">USDC</Option>
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
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Estimated Loan Fee">
              <span className="ant-form-text">
                {estimatedLoanFee.toFixed(2)} {vaultMint?.toUpperCase()}
              </span>
            </Form.Item>

            <Form.Item label="Total Top Up Amount">
              <span className="ant-form-text">
                {totalTopUpAmount.toFixed(2)} {vaultMint?.toUpperCase()}
              </span>
            </Form.Item>

            <Form.Item
              name="interestRate"
              label="Interest Rate"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="maxLoanAmount"
              label="Max Loan Amount"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="minLoanAmount"
              label="Min Loan Threshold"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="maxLoanThreshold"
              label="Max Loan Threshold"
              rules={[{ required: true }]}
            >
              <InputNumber prefix="%" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
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
