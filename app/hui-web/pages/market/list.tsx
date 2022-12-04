import { useWorkspace } from "@/hooks/useWorkspace"
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import { BN, web3 } from "@project-serum/anchor"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { Button, Col, Row, Table, Tag } from "antd"
import React, { useState } from "react"
import { ColumnsType } from "antd/es/table"
import useAsyncEffect from "use-async-effect"
import { DEFAULT_DECIMALS, USDTPubKey } from "@/common/constants"
import bs58 from "bs58"
import { formatUnits } from "@ethersproject/units"

interface LoanMetadataDataType {
  key: React.Key
  isListed: boolean
  isClaimed: boolean
  isSold: boolean
  price: string
  parent: PublicKey
  onListNFT: () => void
  onDelistNFT: () => void
}

const columns: ColumnsType<LoanMetadataDataType> = [
  {
    title: "Is Listed",
    dataIndex: "isListed",
    key: "isListed",
    render: (_, { isListed }) => (
      <div>
        <Tag color={"blue"}>{isListed ? "True" : "False"}</Tag>
      </div>
    ),
  },
  {
    title: "Is Sold",
    dataIndex: "isSold",
    key: "isSold",
    render: (_, { isSold }) => (
      <div>
        <Tag color={"blue"}>{isSold ? "True" : "False"}</Tag>
      </div>
    ),
  },
  {
    title: "Is Claimed",
    dataIndex: "isClaimed",
    key: "isClaimed",
    render: (_, { isClaimed }) => (
      <div>
        <Tag color={"blue"}>{isClaimed ? "True" : "False"}</Tag>
      </div>
    ),
  },
  {
    title: "Price (USDT)",
    dataIndex: "price",
    key: "price",
  },
  {
    title: "Parent",
    dataIndex: "parent",
    key: "parent",
    render: (_, { parent }) => (
      <div>
        <span>{parent?.toBase58()}</span>
      </div>
    ),
  },
  {
    title: "Action",
    dataIndex: "",
    key: "",
    render: (_, { onListNFT, onDelistNFT }) => {
      return (
        <div>
          <Button onClick={onListNFT}>List</Button>
          <Button onClick={onDelistNFT}>Delist</Button>
        </div>
      )
    },
  },
]

const ListNFT = () => {
  const workspace = useWorkspace()

  const [loanMetadatas, setListLoanMetadatas] = useState<
    LoanMetadataDataType[]
  >([])

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { client, program, connection, wallet } = workspace.value

      const loanMetadatas = await client
        .from("LoanMetadata")
        .offset(0)
        .limit(10)
        .select()

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      )

      const map = tokenAccounts.value.reduce<any>((acc, item) => {
        const { mint, tokenAmount } = item.account.data.parsed.info
        if (tokenAmount.amount === "1" || tokenAmount.amount === "0") {
          acc[mint] = true
        }

        return acc
      }, {})

      const selectedAccounts = loanMetadatas.filter((v) => {
        return map[v.account.nftMint.toBase58()]
      })

      const fetcher = async (nftMintPubKey: PublicKey) => {
        return client
          .from("ItemForSale")
          .filters([
            {
              memcmp: {
                offset: 8,
                bytes: bs58.encode(nftMintPubKey.toBuffer()),
              },
            },
          ])
          .limit(1)
          .select()
      }
      const nftMintKeys = selectedAccounts.map((value) => value.account.nftMint)
      const itemForSales = await Promise.allSettled(nftMintKeys.map(fetcher))
      const results: any[] = selectedAccounts.map((loanMetadata, index) => {
        const itemForSale = itemForSales[index]
        if (itemForSale.status === "fulfilled") {
          return {
            ...loanMetadata,
            itemForSale: itemForSale.value[0],
          }
        }

        return loanMetadata
      })

      console.log("results", results)
      const data = results.map<LoanMetadataDataType>(
        ({ publicKey, account, itemForSale }) => {
          return {
            key: publicKey.toBase58(),
            parent: account.parent,
            isListed: itemForSale?.account.isOpen,
            isClaimed: account.isClaimed,
            isSold: itemForSale?.account.isSold,
            price: itemForSale
              ? formatUnits(itemForSale?.account.price.toString(), 9)
              : "0",
            onListNFT: () =>
              onListNFT(publicKey, account.nftMint, account.claimAccount),
            onDelistNFT: () =>
              onDelistNFT(publicKey, account.nftMint, itemForSale.publicKey),
          }
        }
      )

      setListLoanMetadatas(data)
    }
  }, [workspace.value])

  const onListNFT = async (
    loanMetadataPubKey: PublicKey,
    nftMint: PublicKey,
    claimAccount: PublicKey
  ) => {
    if (workspace.value) {
      const { program, wallet, connection } = workspace.value
      const itemAccountKeypair = Keypair.generate()
      const itemForSaleKeypair = Keypair.generate()
      const itemForSaleUSDTKeypair = Keypair.generate()
      const [itemForSalePDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("itemForSale"),
          wallet.publicKey.toBuffer(),
          nftMint.toBuffer(),
          itemAccountKeypair.publicKey.toBuffer(),
        ],
        program.programId
      )
      // const mint = await getMint(connection, nftMint)
      // const nftAccount = await getOrCreateAssociatedTokenAccount(
      //   workspace.value,
      //   claimAccount,
      //   mint
      // )
      const tx = await program.methods
        .listNft(new BN(50 * DEFAULT_DECIMALS))
        .accounts({
          seller: wallet.publicKey,
          loanMetadata: loanMetadataPubKey,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          nftAccount: claimAccount,
          nftMint,
          itemAccount: itemAccountKeypair.publicKey,
          itemForSale: itemForSaleKeypair.publicKey,
          itemForSalePda: itemForSalePDA,
          vaultMint: USDTPubKey,
          vaultAccount: itemForSaleUSDTKeypair.publicKey,
        })
        .preInstructions([
          await program.account.itemForSale.createInstruction(
            itemForSaleKeypair
          ),
        ])
        .signers([
          itemAccountKeypair,
          itemForSaleKeypair,
          itemForSaleUSDTKeypair,
        ])
        .rpc()
      console.log("tx", tx)
    }
  }

  const onDelistNFT = async (
    publicKey: PublicKey,
    nftMint: PublicKey,
    saleAccount: PublicKey
  ) => {
    if (workspace.value) {
      const { program, wallet } = workspace.value

      const itemForSale = await program.account.itemForSale.fetch(saleAccount)

      const [itemForSalePDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("itemForSale"),
          wallet.publicKey.toBuffer(),
          nftMint.toBuffer(),
          itemForSale.itemAccount.toBuffer(),
        ],
        program.programId
      )

      const tx = await program.methods
        .delistNft()
        .accounts({
          nftMint,
          loanMetadata: publicKey,
          nftAccount: itemForSale.ownerAccount,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          itemForSalePda: itemForSalePDA,
          itemForSale: saleAccount,
          itemAccount: itemForSale.itemAccount,
          owner: wallet.publicKey,
        })
        .rpc()
      console.log(tx)
    }
  }

  return (
    <div>
      <button onClick={() => {}}>List NFT</button>
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

export default ListNFT
