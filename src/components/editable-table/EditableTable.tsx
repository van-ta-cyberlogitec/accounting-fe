import React from "react";
import { Form, Table, Button, Popconfirm, Space, Tooltip } from "antd";
import {
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { EditableCell } from "./EditableCell";
import { FloatingMenu, FloatingMenuAction } from "../FloatingMenu";

export interface EditableColumnType<RecordType> {
  title?: React.ReactNode;
  dataIndex?: string;
  key?: string;
  render?: (value: any, record: RecordType, index: number) => React.ReactNode;
  editable?: boolean;
  inputType?: "text" | "number" | "select" | "switch" | "date";
  inputProps?: any;
  required?: boolean;
  width?: string | number;
}

interface EditableTableProps<RecordType> {
  columns: EditableColumnType<RecordType>[];
  dataSource: RecordType[];
  loading?: boolean;
  rowKey?: string;
  pagination?: any;
  editableHook: any; // Return type of useEditableTable
  onSave: (id: string | number, values: any) => Promise<void> | void;
  showDelete?: boolean;
  onDelete?: (id: string | number) => Promise<void> | void;
  extraFloatingActions?: FloatingMenuAction[];
}

export function EditableTable<RecordType extends { id: string | number }>({
  columns,
  dataSource,
  loading,
  rowKey = "id",
  pagination,
  editableHook,
  onSave,
  showDelete,
  onDelete,
  extraFloatingActions,
}: EditableTableProps<RecordType>) {
  const {
    form,
    editingKeys,
    isEditing,
    startEdit,
    cancelEdit,
    startEditAll,
    cancelEditAll,
  } = editableHook;

  const handleSave = async (id: string | number) => {
    try {
      const fieldNames = columns
        .filter((col) => col.editable && col.dataIndex)
        .map((col) => [id, col.dataIndex!]);

      await form.validateFields(fieldNames);
      const rowValues = form.getFieldValue(id);
      await onSave(id, rowValues);
      cancelEdit(id);
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const handleSaveAll = async () => {
    try {
      const fieldNames: any[] = [];
      editingKeys.forEach((id: string | number) => {
        columns
          .filter((col) => col.editable && col.dataIndex)
          .forEach((col) => {
            fieldNames.push([id, col.dataIndex!]);
          });
      });

      await form.validateFields(fieldNames);

      // Save all rows sequentially
      for (const id of editingKeys) {
        const rowValues = form.getFieldValue(id);
        if (rowValues) {
          await onSave(id, rowValues);
        }
      }
      cancelEditAll();
    } catch (errInfo) {
      console.log("Save All Failed:", errInfo);
    }
  };

  const actionColumn: EditableColumnType<RecordType> = {
    title: "Actions",
    dataIndex: "operation",
    width: 100,
    render: (_: any, record: RecordType) => {
      const editable = isEditing(record);
      return editable ? (
        <Space size="small">
          <Tooltip title="Submit">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }} // Green Submit
              onClick={() => handleSave(record.id)}
            />
          </Tooltip>
          <Tooltip title="Cancel">
            <Button
              icon={<CloseOutlined />}
              size="small"
              onClick={() => cancelEdit(record.id)}
            />
          </Tooltip>
        </Space>
      ) : (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }} // Blue Edit
              disabled={editingKeys.length > 0 && !isEditing(record)}
              onClick={() => startEdit(record)}
            />
          </Tooltip>
          {showDelete && onDelete && (
            <Popconfirm
              title="Sure to delete?"
              onConfirm={() => onDelete(record.id)}
            >
              <Tooltip title="Delete">
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  disabled={editingKeys.length > 0}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      );
    },
  };

  const mergedColumns = [...columns, actionColumn].map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: RecordType) => ({
        record,
        inputType: col.inputType || "text",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: col.required,
        inputProps: col.inputProps,
      }),
    };
  });

  const floatingActions: FloatingMenuAction[] = [];
  if (editingKeys.length === 0) {
    floatingActions.push({
      key: "edit-all",
      label: "Edit All Rows",
      icon: <EditOutlined />,
      type: "primary",
      onClick: () => startEditAll(dataSource),
    });

    if (extraFloatingActions) {
      floatingActions.push(...extraFloatingActions);
    }
  } else {
    floatingActions.push(
      {
        key: "save-all",
        label: "Save All",
        icon: <CheckOutlined />,
        type: "primary",
        style: { backgroundColor: "#52c41a", borderColor: "#52c41a" },
        onClick: handleSaveAll,
      },
      {
        key: "cancel-all",
        label: "Cancel All",
        icon: <CloseOutlined />,
        danger: true,
        onClick: cancelEditAll,
      },
    );
  }

  return (
    <div className="relative">
      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          bordered
          dataSource={dataSource}
          columns={mergedColumns as any}
          rowClassName="editable-row"
          pagination={pagination}
          loading={loading}
          rowKey={rowKey}
          scroll={{ x: "max-content" }}
        />
      </Form>
      <FloatingMenu actions={floatingActions} />
    </div>
  );
}
