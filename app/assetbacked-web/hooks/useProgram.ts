import { useProvider } from "./useProvider"
import { useEffect, useState } from "react"
import { Program } from "@project-serum/anchor"
import { HelloAnchor } from "../contracts/types/hello_anchor"
import {
  assetBackedPInterface,
  assetBackedProgramId,
} from "../contracts/constants"

export const useProgram = () => {
  const provider = useProvider()
  const [program, setProgram] = useState<Program<HelloAnchor>>()

  useEffect(() => {
    const program = new Program(
      assetBackedPInterface,
      assetBackedProgramId,
      provider
    )
    setProgram(program)
  }, [])

  return program
}
