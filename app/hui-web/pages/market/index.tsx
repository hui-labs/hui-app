import { useRouter } from "next/router"
import useAsyncEffect from "use-async-effect"
import { useWorkspace } from "@/hooks/useWorkspace"
import React, { useState } from "react"
import { Button, Col, Row, Table } from "antd"
import { ColumnsType } from "antd/es/table"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import dayjs from "dayjs"
import { formatUnits } from "@ethersproject/units"
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { getOrCreateAssociatedTokenAccount } from "@/services"
import { web3 } from "@project-serum/anchor"
import { USDTPubKey } from "@/common/constants"

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
    title: "Action",
    render: (_, { onBuy }) => {
      return (
        <div>
          <Button onClick={onBuy}>Buy</Button>
        </div>
      )
    },
  },
]

const Market = () => {
  const router = useRouter()
  const workspace = useWorkspace()

  const [loanMetadatas, setListLoanMetadatas] = useState<ItemForSaleDataType[]>(
    []
  )

  const onBuy = async (
    publicKey: PublicKey,
    owner: PublicKey,
    nftMint: PublicKey,
    itemAccount: PublicKey,
    vaultMint: PublicKey,
    vaultAccount: PublicKey,
    metadataAccount: PublicKey
  ) => {
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
      console.log(tx)
      // const a = connection.getTokenAccountBalance()
    }
  }

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { client, wallet } = workspace.value

      const itemForSales = await client
        .from("ItemForSale")
        .offset(0)
        .limit(10)
        .select()

      const data = itemForSales.reduce<ItemForSaleDataType[]>(
        (acc, { publicKey, account }) => {
          if (
            account.owner.toBase58() !== wallet.publicKey.toBase58() &&
            !account.isSold
          ) {
            return acc.concat({
              key: publicKey.toBase58(),
              owner: account.owner,
              isOwner: account.owner.toBase58() !== wallet.publicKey.toBase58(),
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
  }, [workspace.value])

  return (
    <div>
      <button onClick={() => router.push("/market/list")}>List your NFT</button>
      <Row>
        <Col span={24}>
          <Table
            columns={columns}
            pagination={false}
            dataSource={loanMetadatas}
          />
        </Col>
      </Row>
    </div>
  )
}

export default Market
