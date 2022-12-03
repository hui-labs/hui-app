import React, { Component, ReactElement, ReactNode } from "react"
import Header from "@/components/Header"

const Layout = ({ children }: React.Component) => {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  )
}

export default Layout
