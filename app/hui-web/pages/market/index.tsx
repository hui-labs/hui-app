import { useRouter } from "next/router"
import useAsyncEffect from "use-async-effect"
import { commitmentLevel, useWorkspace } from "@/hooks/useWorkspace"
import React, { useState } from "react"
import { Button, Col, Row, Table, Typography } from "antd"
import { ColumnsType } from "antd/es/table"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import dayjs from "dayjs"
import { formatUnits } from "@ethersproject/units"
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { getOrCreateAssociatedTokenAccount } from "@/services"
import { web3 } from "@project-serum/anchor"
import { USDTPubKey } from "@/common/constants"
import { catchError } from "@/helps/notification"
import { ModalSuccess } from "@/components/ModalSuccess"

const { Title } = Typography

interface ItemForSaleDataType {
  key: React.Key
  owner: PublicKey
  isOwner: boolean
  price: string
  createdAt: string
  onBuy: () => void
}

const columns: ColumnsType<ItemForSaleDataType> = [
  {
    title: "Owner",
    dataIndex: "owner",
    key: "owner",
    render: (_, { owner }) => (
      <div>
        <span>{owner.toBase58()}</span>
      </div>
    ),
  },
  {
    title: "Price (USDT)",
    dataIndex: "price",
    key: "price",
    render: (_, { price }) => (
      <div>
        <span>{price}</span>
      </div>
    ),
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (_, { createdAt }) => (
      <div>
        <span>{createdAt}</span>
      </div>
    ),
  },
  {
    title: "",
    render: (_, { onBuy }) => {
      return (
        <div>
          <Button
            type="primary"
            className="bg-indigo-500 hover:bg-indigo-600"
            onClick={onBuy}
          >
            Buy
          </Button>
        </div>
      )
    },
  },
]

const Market = () => {
  const router = useRouter()
  const workspace = useWorkspace()
  const [created, setCreated] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const [loanMetadatas, setListLoanMetadatas] = useState<ItemForSaleDataType[]>(
    []
  )
  const [openPopupSuccess, setOpenPopupSuccess] = useState(false)

  const onBuy = async (
    publicKey: PublicKey,
    owner: PublicKey,
    nftMint: PublicKey,
    itemAccount: PublicKey,
    vaultMint: PublicKey,
    vaultAccount: PublicKey,
    metadataAccount: PublicKey
  ) => {
    setLoading(true)
    try {
      if (workspace.value) {
        const { program, wallet, connection } = workspace.value

        const [itemForSalePDA] = await PublicKey.findProgramAddress(
          [
            Buffer.from("itemForSale"),
            owner.toBuffer(),
            nftMint.toBuffer(),
            itemAccount.toBuffer(),
          ],
          program.programId
        )

        const mint = await getMint(connection, USDTPubKey)
        const buyerTokenAccount = await getOrCreateAssociatedTokenAccount(
          workspace.value,
          wallet.publicKey,
          mint,
          false
        )

        if (!buyerTokenAccount) {
          throw new Error("Missing buyer token account")
        }

        const vaultAssociatedAccount = await getAssociatedTokenAddress(
          USDTPubKey,
          owner,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )

        const walletVaultAccount = await getAccount(
          connection,
          vaultAssociatedAccount,
          commitmentLevel
        )
        if (!buyerTokenAccount) {
          throw new Error("Missing buyer token account")
        }
        console.log(formatUnits(buyerTokenAccount.amount, 9))

        const associatedNftTokenAccount = await getAssociatedTokenAddress(
          nftMint,
          wallet.publicKey
        )
        const tx = await program.methods
          .buyNft()
          .accounts({
            nftMint,
            itemForSale: publicKey,
            itemForSalePda: itemForSalePDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            itemAccount,
            loanMetadata: metadataAccount,
            buyer: wallet.publicKey,
            buyerAccount: associatedNftTokenAccount,
            vaultMint: vaultMint,
            vaultAccount: vaultAccount,
            buyerTokenAccount: buyerTokenAccount.address,
            sellerTokenAccount: walletVaultAccount.address,
          })
          .preInstructions([
            await createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              associatedNftTokenAccount,
              wallet.publicKey,
              nftMint
            ),
          ])
          .rpc()
        setCreated(tx)
        showPopupSuccess()
        console.log(tx)
      }
      setLoading(false)
    } catch (err) {
      if (err instanceof Error) {
        catchError("On Buy", err)
        setLoading(false)
      }
    }
  }

  useAsyncEffect(async () => {
    setLoading(true)
    try {
      if (workspace.value) {
        const { client, wallet } = workspace.value

        const itemForSales = await client
          .from("ItemForSale")
          .offset(0)
          .limit(10)
          .select()

        console.log("itemForSales", itemForSales)
        const data = itemForSales.reduce<ItemForSaleDataType[]>(
          (acc, { publicKey, account }) => {
            if (
              account.owner.toBase58() !== wallet.publicKey.toBase58() &&
              !account.isSold
            ) {
              return acc.concat({
                key: publicKey.toBase58(),
                owner: account.owner,
                isOwner:
                  account.owner.toBase58() !== wallet.publicKey.toBase58(),
                price: formatUnits(account.price.toString(), 9),
                createdAt: dayjs
                  .unix(account.createdAt)
                  .format("DD/MM/YYYY HH:mm"),
                onBuy: () =>
                  onBuy(
                    publicKey,
                    account.owner,
                    account.nftMint,
                    account.itemAccount,
                    account.vaultMint,
                    account.vaultAccount,
                    account.metadataAccount
                  ),
              } as ItemForSaleDataType)
            }

            return acc
          },
          []
        )
        setListLoanMetadatas(data)
      }
      setLoading(false)
    } catch (err) {
      if (err instanceof Error) {
        catchError("Set List Loan Meta Data", err)
        setLoading(false)
      }
    }
  }, [workspace.value, created])

  const hidePopupSuccess = () => {
    setOpenPopupSuccess(false)
  }

  const showPopupSuccess = () => {
    setOpenPopupSuccess(true)
  }

  return (
    <div className="px-6 mt-5">
      <div className="flex justify-between items-center max-w-screen-2xl mx-auto mb-5">
        <Title level={2}>Loan Market</Title>
        <div className="h-full">
          <button
            className="bg-indigo-500 text-white p-3 rounded-md w-36 text-center hover:bg-indigo-600 ml-5"
            onClick={() => router.push("/market/list")}
          >
            List your NFT
          </button>
        </div>
      </div>

      <Row>
        <Col span={24}>
          <Table
            columns={columns}
            pagination={false}
            dataSource={loanMetadatas}
            loading={loading}
          />
        </Col>
      </Row>
      <ModalSuccess
        isOpen={openPopupSuccess}
        onCancel={hidePopupSuccess}
        onSubmit={hidePopupSuccess}
        title={"Buy NFT Success"}
      />
    </div>
  )
}

export default Market
