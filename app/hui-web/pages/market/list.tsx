import { useWorkspace } from "@/hooks/useWorkspace"
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import { BN, web3 } from "@project-serum/anchor"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { DEFAULT_DECIMALS, USDTPubKey } from "@/common/constants"

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

  const loadNFTs = async () => {
    if (workspace.value) {
      const { program } = workspace.value
      const listLoanMetadata = await program.account.loanMetadata.all()
      console.log(listLoanMetadata)
    }
  }

  const listNFT = async (
    nftMint: PublicKey,
    nftAccount: PublicKey,
    loanMetadataPubKey: PublicKey
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
      <button onClick={loadNFTs}>Load NFTs</button>
      <button onClick={() => {}}>List NFT</button>
    </div>
  )
}

export default ListNFT
