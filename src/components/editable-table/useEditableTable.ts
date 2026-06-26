import { useState } from "react";
import { Form } from "antd";

export interface EditableRecord {
  id: string | number;
  [key: string]: any;
}

export function useEditableTable<T extends EditableRecord>() {
  const [form] = Form.useForm();
  const [editingKeys, setEditingKeys] = useState<(string | number)[]>([]);

  const isEditing = (record: T) => editingKeys.includes(record.id);

  const startEdit = (record: Partial<T> & { id: string | number }) => {
    form.setFieldsValue({
      [record.id]: { ...record },
    });
    setEditingKeys((prev) => [...prev, record.id]);
  };

  const cancelEdit = (id: string | number) => {
    setEditingKeys((prev) => prev.filter((k) => k !== id));
  };

  const startEditAll = (records: T[]) => {
    const values: any = {};
    records.forEach((record) => {
      values[record.id] = { ...record };
    });
    form.setFieldsValue(values);
    setEditingKeys(records.map((r) => r.id));
  };

  const cancelEditAll = () => {
    setEditingKeys([]);
  };

  return {
    form,
    editingKeys,
    setEditingKeys,
    isEditing,
    startEdit,
    cancelEdit,
    startEditAll,
    cancelEditAll,
  };
}
