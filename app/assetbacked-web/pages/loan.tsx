import React from "react"
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { Input } from "antd"

interface IFormInput {
  maxValue: Number
  minValue: Number
}

export default function Loan() {
  const { handleSubmit, control } = useForm<IFormInput>()
  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    console.log(data)
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>Max Value</label>
        <Controller
          name="maxValue"
          control={control}
          defaultValue={0}
          render={({ field }) => <Input onChange={field.onChange} />}
        />

        <label>min Value</label>
        <Controller
          name="minValue"
          control={control}
          defaultValue={0}
          render={({ field }) => <Input onChange={field.onChange} />}
        />

        <input type="submit" />
      </form>
    </div>
  )
}
