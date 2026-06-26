import React from "react";
import { Form, Input, Select, Switch } from "antd";

export interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: "text" | "number" | "select" | "switch" | "date";
  record: any;
  index: number;
  required?: boolean;
  inputProps?: any;
  children: React.ReactNode;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  required,
  inputProps,
  children,
  ...restProps
}) => {
  const inputNode =
    inputType === "switch" ? (
      <Switch {...inputProps} />
    ) : inputType === "select" ? (
      <Select {...inputProps} style={{ width: "100%", ...inputProps?.style }} />
    ) : inputType === "date" ? (
      <Input type="date" {...inputProps} />
    ) : (
      <Input type={inputType === "number" ? "number" : "text"} {...inputProps} />
    );

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={[record.id, dataIndex]}
          style={{ margin: 0 }}
          valuePropName={inputType === "switch" ? "checked" : "value"}
          rules={[
            {
              required: required,
              message: `Please input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};
