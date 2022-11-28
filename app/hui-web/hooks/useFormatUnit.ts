import { useMemo } from "react"
import { formatUnits } from "@ethersproject/units"

export function useFormatUnit(value?: number, d?: number): string
export function useFormatUnit(value?: bigint, d?: number): string
export function useFormatUnit(value?: any, decimals = 9): string {
  return useMemo(() => {
    if (value) {
      // return value.toString()
      return formatUnits(value.toString(), decimals)
    }

    return "0"
  }, [decimals, value])
}
