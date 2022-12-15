import React from "react"
import Lottie from "react-lottie"
import * as animationData from "../success.json"

import { Modal } from "antd"

interface ModalSuccessProps {
  isOpen: boolean
  onSubmit: () => void
  onCancel: () => void
  title: string
}

export const ModalSuccess = (props: ModalSuccessProps) => {
  const { isOpen, onSubmit, onCancel, title } = props
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  }

  return (
    <Modal
      open={isOpen}
      width={600}
      okButtonProps={{
        className: "bg-indigo-500 hover:bg-indigo-600 w-full h-10",
      }}
      onOk={onSubmit}
      cancelButtonProps={{ style: { display: "none" } }}
      onCancel={onCancel}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 30,
          paddingBottom: 30,
        }}
      >
        <Lottie
          options={defaultOptions}
          height={200}
          width={200}
          isStopped={false}
          isPaused={false}
        />
        <h1
          style={{
            display: "flex",
            paddingTop: 30,
            fontSize: 30,
          }}
          className="font-medium"
        >
          {title}
        </h1>
      </div>
    </Modal>
  )
}
