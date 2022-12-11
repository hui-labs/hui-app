export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      master_loans: {
        Row: {
          pubkey: string
          created_at: string | null
          updated_at: string | null
          amount: number
          collateral_mint: string
          collateral_account: string
          nft_mint: string
          owner: string
          system_fee_account: string
          deposit_account: string
          withdrawal_account: string
          pool: string
          tx: string
        }
        Insert: {
          pubkey: string
          created_at?: string | null
          updated_at?: string | null
          amount: number
          collateral_mint: string
          collateral_account: string
          nft_mint: string
          owner: string
          system_fee_account: string
          deposit_account: string
          withdrawal_account: string
          pool: string
          tx: string
        }
        Update: {
          pubkey?: string
          created_at?: string | null
          updated_at?: string | null
          amount?: number
          collateral_mint?: string
          collateral_account?: string
          nft_mint?: string
          owner?: string
          system_fee_account?: string
          deposit_account?: string
          withdrawal_account?: string
          pool?: string
          tx?: string
        }
      }
      metadata: {
        Row: {
          pubkey: string
          created_at: string | null
          updated_at: string | null
          nft_mint: string
          nft_account: string | null
          status: string | null
          amount: number
          is_claimed: boolean
          tx: string
          master_loan: string | null
        }
        Insert: {
          pubkey: string
          created_at?: string | null
          updated_at?: string | null
          nft_mint: string
          nft_account?: string | null
          status?: string | null
          amount: number
          is_claimed?: boolean
          tx: string
          master_loan?: string | null
        }
        Update: {
          pubkey?: string
          created_at?: string | null
          updated_at?: string | null
          nft_mint?: string
          nft_account?: string | null
          status?: string | null
          amount?: number
          is_claimed?: boolean
          tx?: string
          master_loan?: string | null
        }
      }
      nfts: {
        Row: {
          pubkey: string
          created_at: string | null
          updated_at: string | null
          owner: string
          master_loan: string | null
          metadata: string | null
        }
        Insert: {
          pubkey: string
          created_at?: string | null
          updated_at?: string | null
          owner: string
          master_loan?: string | null
          metadata?: string | null
        }
        Update: {
          pubkey?: string
          created_at?: string | null
          updated_at?: string | null
          owner?: string
          master_loan?: string | null
          metadata?: string | null
        }
      }
      pools: {
        Row: {
          pubkey: string
          created_at: string | null
          updated_at: string | null
          interest_rate: number
          max_loan_amount: number
          min_loan_amount: number
          max_loan_threshold: number
          amount: number
          commission_fee: number
          loan_term: string
          vault_mint: string
          vault_account: string
          collateral_mint: string
          owner: string
          system_fee_account: string
          deposit_token: string
          status: string
          tx: string
        }
        Insert: {
          pubkey: string
          created_at?: string | null
          updated_at?: string | null
          interest_rate: number
          max_loan_amount: number
          min_loan_amount: number
          max_loan_threshold: number
          amount: number
          commission_fee: number
          loan_term: string
          vault_mint: string
          vault_account: string
          collateral_mint: string
          owner: string
          system_fee_account: string
          deposit_token: string
          status: string
          tx: string
        }
        Update: {
          pubkey?: string
          created_at?: string | null
          updated_at?: string | null
          interest_rate?: number
          max_loan_amount?: number
          min_loan_amount?: number
          max_loan_threshold?: number
          amount?: number
          commission_fee?: number
          loan_term?: string
          vault_mint?: string
          vault_account?: string
          collateral_mint?: string
          owner?: string
          system_fee_account?: string
          deposit_token?: string
          status?: string
          tx?: string
        }
      }
      sales: {
        Row: {
          pubkey: string
          created_at: string | null
          updated_at: string | null
          price: number
          seller: string
          buyer: string | null
          nft: string
          vault_mint: string
          vault_token_account: string
          vault_nft_account: string
          tx: string
        }
        Insert: {
          pubkey: string
          created_at?: string | null
          updated_at?: string | null
          price: number
          seller: string
          buyer?: string | null
          nft: string
          vault_mint: string
          vault_token_account: string
          vault_nft_account: string
          tx: string
        }
        Update: {
          pubkey?: string
          created_at?: string | null
          updated_at?: string | null
          price?: number
          seller?: string
          buyer?: string | null
          nft?: string
          vault_mint?: string
          vault_token_account?: string
          vault_nft_account?: string
          tx?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
