import { notification } from "antd"

export const catchError = (title: string, error: Error) => {
  notification.error({
    message: title,
    className: "bg-red-100",
    description: (
      <div>
        <h1 className="font-bold">{error.name}</h1>
        <p>{error.message}</p>
      </div>
    ),
  })
}
