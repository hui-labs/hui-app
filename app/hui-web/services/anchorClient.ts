import { AccountClient, Program } from "@project-serum/anchor"
import { Hui } from "@/contracts/types/hui"
import {
  Connection,
  GetProgramAccountsFilter,
  PublicKey,
} from "@solana/web3.js"
import { sha256 } from "js-sha256"
import { programId } from "@/common/constants"
import bs58 from "bs58"

export type Account = "ItemForSale" | "LoanMetadata" | "MasterLoan" | "Pool"

export interface IBuilder {
  from(account: Account): this

  offset(value: number): this

  limit(value: number): this

  filters(filters: GetProgramAccountsFilter[]): this

  select<T = any>(): Promise<SelectResult<T>[]>

  one<T = any>(): Promise<SelectResult<T>>
}

interface SelectResult<T> {
  publicKey: PublicKey
  account: T
}

export const DISCRIMINATOR_LENGTH = 8

export const getAccountPublicKeys = async (
  connection: Connection,
  name: string,
  filters: GetProgramAccountsFilter[]
) => {
  const discriminator = Buffer.from(sha256.digest(`account:${name}`)).slice(
    0,
    DISCRIMINATOR_LENGTH
  )

  const accounts = await connection.getProgramAccounts(programId, {
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: bs58.encode(discriminator),
        },
      },
      ...filters,
    ],
  })

  return accounts.map((account) => account.pubkey)
}

export const getPage = async <T = any>(
  accountClient: AccountClient<Hui>,
  accountPublicKeys: PublicKey[],
  page: number = 1,
  limit: number = 10
): Promise<SelectResult<T>[]> => {
  if (page === 0) page += 1

  const paginatedPublicKeys = accountPublicKeys.slice(
    (page - 1) * limit,
    page * limit
  )

  if (paginatedPublicKeys.length === 0) {
    return []
  }

  const accounts = await accountClient.fetchMultiple(paginatedPublicKeys)

  return accounts.map<SelectResult<T>>((account, index) => ({
    publicKey: paginatedPublicKeys[index],
    account: account as any,
  }))
}

export class Builder implements IBuilder {
  private _account: Account | null = null
  private _limit = 10
  private _offset = 0
  private _filters: GetProgramAccountsFilter[] = []

  constructor(private program: Program<Hui>) {
  }

  async select<T = any>(): Promise<SelectResult<T>[]> {
    if (!this._account) {
      throw new Error("Unexpected error")
    }

    const accountPublicKeys = await getAccountPublicKeys(
      this.program.provider.connection,
      this._account,
      this._filters
    )

    return await getPage(
      this.getNamespace(),
      accountPublicKeys,
      this._offset,
      this._limit
    )
  }

  async one<T = any>(): Promise<SelectResult<T>> {
    const results = await this.select()
    return results[0]
  }

  filters(filters: GetProgramAccountsFilter[]): this {
    this._filters = filters
    return this
  }

  from(account: Account): this {
    this._account = account
    return this
  }

  limit(value: number): this {
    this._limit = value
    return this
  }

  offset(value: number): this {
    this._offset = value
    return this
  }

  private getNamespace(): AccountClient<Hui> {
    switch (this._account) {
      case "ItemForSale":
        return this.program.account.itemForSale
      case "MasterLoan":
        return this.program.account.masterLoan
      case "LoanMetadata":
        return this.program.account.loanMetadata
      case "Pool":
        return this.program.account.pool
      default:
        throw new Error("Not support this account")
    }
  }
}

export class AnchorClient {
  constructor(private program: Program<Hui>) {
  }

  from(account: Account): Builder {
    const builder = new Builder(this.program)
    builder.from(account)
    return builder
  }
}
