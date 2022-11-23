import { useMemo } from "react"

export const useFormatUnit = (value?: bigint | number, decimals = 9) => {
  return useMemo(() => {
    if (value) {
      return value.toString()
    }

    return 0
  }, [value])
}
