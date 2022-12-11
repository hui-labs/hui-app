import { useWorkspace } from "@/hooks/useWorkspace"
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import { BN, web3 } from "@project-serum/anchor"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { Button, Col, Row, Table, Typography } from "antd"
import React, { useState } from "react"
import { ColumnsType } from "antd/es/table"
import { DEFAULT_DECIMALS, USDTPubKey } from "@/common/constants"
import useAsyncEffect from "use-async-effect"
import bs58 from "bs58"
import { AnchorClient } from "@/services/anchorClient"
import { formatUnits } from "@ethersproject/units"
import { catchError } from "@/helps/notification"
import { router } from "next/client"

const { Title } = Typography

interface LoanMetadataDataType {
  key: React.Key
  isOwner: boolean
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
    title: "",
    dataIndex: "",
    key: "",
    render: (_, { onListNFT, onDelistNFT, isListed }) => {
      if (isListed) {
        return (
          <div>
            <Button onClick={onDelistNFT}>Delist</Button>
          </div>
        )
      }

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
  const [created, setCreated] = useState<string | null>(null)
  const [loanMetadatas, setListLoanMetadatas] = useState<
    LoanMetadataDataType[]
  >([])

  const itemForSaleFetcher = async (
    client: AnchorClient,
    ownerPubKey: PublicKey,
    nftMintPubKey: PublicKey
  ) => {
    try {
      return client
        .from("ItemForSale")
        .filters([
          {
            memcmp: {
              offset: 8,
              bytes: bs58.encode(nftMintPubKey.toBuffer()),
            },
          },
          {
            memcmp: {
              offset: 8 + 32 + 32 + 32,
              bytes: bs58.encode(ownerPubKey.toBuffer()),
            },
          },
        ])
        .limit(1)
        .select()
    } catch (err) {
      if (err instanceof Error) {
        catchError("Item For Sale Fetcher", err)
      }
    }
  }

  const loanMetadataFetcher = async (
    client: AnchorClient,
    nftMintPubKey: PublicKey
  ) => {
    try {
      return client
        .from("LoanMetadata")
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
    } catch (err) {
      if (err instanceof Error) {
        catchError("Loan Meta Data Fetcher", err)
      }
    }
  }

  const fetchNftInfo = async (
    client: AnchorClient,
    ownerPubKey: PublicKey,
    nftMintPubKey: PublicKey,
    tokenAccount: any
  ) => {
    try {
      const [q1, q2] = await Promise.allSettled([
        loanMetadataFetcher(client, nftMintPubKey),
        itemForSaleFetcher(client, ownerPubKey, nftMintPubKey),
      ])

      const results: Record<string, any> = {
        tokenAccount,
        nftMintPubKey,
      }

      if (q1.status === "fulfilled") {
        results.loanMetadata = q1.value[0] ?? null
      }

      if (q2.status === "fulfilled") {
        results.itemForSale = q2.value[0] ?? null
      }

      return results
    } catch (err) {
      if (err instanceof Error) {
        catchError("Fetch NFT Info", err)
      }
    }
  }

  useAsyncEffect(async () => {
    try {
      if (workspace.value) {
        const { connection, wallet, client } = workspace.value
        const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
          wallet.publicKey,
          {
            programId: TOKEN_PROGRAM_ID,
          }
        )

        const nftAccounts = allTokenAccounts.value
          .map((v) => {
            const { mint, tokenAmount } = v.account.data.parsed.info
            return {
              mint,
              tokenAmount,
            }
          })
          .filter(({ tokenAmount }) => {
            return tokenAmount.amount === "1" || tokenAmount.amount === "0"
          })

        const nftAccountsDetail = await Promise.all(
          nftAccounts.map((account) =>
            fetchNftInfo(
              client,
              wallet.publicKey,
              new PublicKey(account.mint),
              account.tokenAmount
            )
          )
        )
        console.log("nftAccountsDetail", nftAccountsDetail)

        const data = nftAccountsDetail
          .filter(
            (v: any) =>
              (v.loanMetadata !== null && v.itemForSale !== null) ||
              v.tokenAccount.amount !== "0"
          )
          .map<LoanMetadataDataType>(
            ({ itemForSale, loanMetadata, nftMintPubKey }: any) => {
              return {
                key: loanMetadata.publicKey.toBase58(),
                parent: loanMetadata?.account.parent,
                isListed: itemForSale?.account.isOpen,
                isClaimed: loanMetadata?.account.isClaimed,
                isSold: itemForSale?.account.isSold,
                isOwner:
                  itemForSale?.account.owner.toBase58() ===
                  wallet.publicKey.toBase58(),
                price: itemForSale
                  ? formatUnits(itemForSale?.account.price.toString(), 9)
                  : "0",
                onListNFT: () =>
                  onListNFT(loanMetadata?.publicKey, nftMintPubKey),
                onDelistNFT: () =>
                  onDelistNFT(
                    nftMintPubKey,
                    itemForSale?.publicKey,
                    itemForSale?.account.vaultAccount
                  ),
              }
            }
          )
        setListLoanMetadatas(data)
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("Set List Loan Meta Data", err)
      }
    }
  }, [workspace.value, created])

  const onListNFT = async (
    loanMetadataPubKey: PublicKey,
    nftMint: PublicKey
  ) => {
    try {
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

        const claimAccount = await getAssociatedTokenAddress(
          nftMint,
          wallet.publicKey
        )
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
      setCreated(tx)
        console.log("tx", tx)
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("On List NFT", err)
      }
    }
  }

  const onDelistNFT = async (
    nftMint: PublicKey,
    saleAccount: PublicKey,
    vaultAccount: PublicKey
  ) => {
    try {
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
            nftAccount: itemForSale.ownerAccount,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            itemForSalePda: itemForSalePDA,
            itemForSale: saleAccount,
            itemAccount: itemForSale.itemAccount,
            owner: wallet.publicKey,
            vaultAccount,
          })
          .rpc()
        setCreated(tx)
        console.log(tx)
      }
    } catch (err) {
      if (err instanceof Error) {
        catchError("On De List NFT", err)
      }
    }
  }

  return (
    <div className="px-6 mt-5">
      <div className="flex justify-between items-center max-w-screen-xl mx-auto mb-5">
        <Title level={2}>NFT List</Title>
        <div className="h-full">
          <button
            className="bg-indigo-500 text-white p-3 rounded-md w-36 text-center hover:bg-slate-800 ml-5"
            onClick={() => router.push("/market")}
          >
            Market
          </button>
        </div>
      </div>

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
