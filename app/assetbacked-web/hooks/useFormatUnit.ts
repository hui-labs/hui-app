import { useMemo } from "react"

export const useFormatUnit = (value?: bigint | number, decimals = 9) => {
  return useMemo(() => {
    if (value) {
      return (BigInt(value) / 1_000_000_000n).toString()
    }

    return 0
  }, [value])
}
