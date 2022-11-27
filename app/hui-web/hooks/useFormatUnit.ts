import { useMemo } from "react"
import { BN } from "@project-serum/anchor"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"

export function useFormatUnit(value?: number, d?: number): string
export function useFormatUnit(value?: bigint, d?: number): string
export function useFormatUnit(value?: any, d = 9): string {
  // const decimals = useMemo(
  //   () => (d >= LAMPORTS_PER_SOL ? LAMPORTS_PER_SOL : Math.pow(10, d)),
  //   [d]
  // )
  //
  // return useMemo(() => {
  //   if (typeof value === "bigint") {
  //     return (
  //       Number((BigInt(value) * 1_000_000n) / BigInt(decimals)) / 1_000_000
  //     ).toString()
  //   }
  //
  //   if (typeof value === "number") {
  //     return (
  //       Number((BigInt(value) * 1_000_000n) / BigInt(decimals)) / 1_000_000
  //     ).toString()
  //   }
  //
  //   return "0"
  // }, [value, decimals])
  if (value) return value.toString()
  return "0"
}
