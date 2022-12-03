import { useWorkspace } from "@/hooks/useWorkspace"
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import { BN, web3 } from "@project-serum/anchor"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { DEFAULT_DECIMALS, USDTPubKey } from "@/common/constants"
import { Button, Col, Row, Table, Tag } from "antd"
import React, { useState } from "react"
import { ColumnsType } from "antd/es/table"
import useAsyncEffect from "use-async-effect"

interface LoanMetadataDataType {
  key: React.Key
  isListed: boolean
  isClaimed: boolean
  parent: PublicKey
  onListNFT: () => void
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
    render: (_, { onListNFT }) => {
      return (
        <div>
          <Button onClick={onListNFT}>List</Button>
        </div>
      )
    },
  },
]

const ListNFT = () => {
  const workspace = useWorkspace()
  const onList = async () => {
    // if (workspace.value) {
    //   const { program, wallet } = workspace.value
    //   const itemAccountKeypair = Keypair.generate()
    //   const itemForSaleKeypair = Keypair.generate()
    //   const itemForSaleUSDTKeypair = Keypair.generate()
    //   const [itemForSalePDA] = await PublicKey.findProgramAddress(
    //     [
    //       Buffer.from("itemForSale"),
    //       wallet.publicKey.toBuffer(),
    //       nftMintKeypair.publicKey.toBuffer(),
    //       itemAccountKeypair.publicKey.toBuffer(),
    //     ],
    //     program.programId
    //   )
    //   await program.methods
    //     .listNft(new BN(50 * DEFAULT_DECIMALS))
    //     .accounts({
    //       seller: wallet.publicKey,
    //       loanMetadata: loanMetadataKeypair.publicKey,
    //       systemProgram: SystemProgram.programId,
    //       rent: web3.SYSVAR_RENT_PUBKEY,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //       nftAccount: aliceNftTokenAccount,
    //       nftMint: nftMintKeypair.publicKey,
    //       itemAccount: itemAccountKeypair.publicKey,
    //       itemForSale: itemForSaleKeypair.publicKey,
    //       itemForSalePda: itemForSalePDA,
    //       vaultMint: usdtMintPubkey,
    //       vaultAccount: itemForSaleUSDTKeypair.publicKey,
    //     })
    //     .preInstructions([
    //       await program.account.itemForSale.createInstruction(
    //         itemForSaleKeypair
    //       ),
    //     ])
    //     .signers([
    //       itemAccountKeypair,
    //       itemForSaleKeypair,
    //       itemForSaleUSDTKeypair,
    //     ])
    //     .rpc()
    // }
  }

  const [loanMetadatas, setListLoanMetadatas] = useState<
    LoanMetadataDataType[]
  >([])

  useAsyncEffect(async () => {
    if (workspace.value) {
      const { program, connection, client } = workspace.value

      const loanMetadatas = await client
        .from("LoanMetadata")
        .offset(0)
        .limit(10)
        .select()
      console.log("loanMetadatas", loanMetadatas)

      const data = loanMetadatas.map<LoanMetadataDataType>(
        ({ publicKey, account }) => {
          return {
            key: publicKey.toBase58(),
            parent: account.parent,
            isListed: account.isListed,
            isClaimed: account.isClaimed,
            onListNFT: () =>
              onListNFT(publicKey, account.nftMint, account.nftAccount),
          }
        }
      )
      setListLoanMetadatas(data)
    }
  }, [workspace.value])

  const onListNFT = async (
    loanMetadataPubKey: PublicKey,
    nftMint: PublicKey,
    nftAccount: PublicKey
  ) => {
    if (workspace.value) {
      const { program, wallet } = workspace.value
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
      const tx = await program.methods
        .listNft(new BN(50 * DEFAULT_DECIMALS))
        .accounts({
          seller: wallet.publicKey,
          loanMetadata: loanMetadataPubKey,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          nftAccount,
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
