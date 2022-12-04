import { useRouter } from "next/router"

const Market = () => {
  const router = useRouter()
  return (
    <div>
      <button onClick={() => router.push("/market/list")}>List your NFT</button>
    </div>
  )
}

export default Market
