import { Form, Input, Modal } from "antd";
import type { FormInstance } from "antd";

interface RejectApplicationModalProps {
  open: boolean;
  saving: boolean;
  form: FormInstance<{ reason: string }>;
  onCancel: () => void;
  onOk: () => void;
}

export function RejectApplicationModal({
  open,
  saving,
  form,
  onCancel,
  onOk,
}: RejectApplicationModalProps) {
  return (
    <Modal
      open={open}
      title="Отклонить заявку"
      onCancel={onCancel}
      onOk={onOk}
      okText="Отклонить"
      confirmLoading={saving}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Причина (необязательно)"
          rules={[{ required: false }]}
        >
          <Input.TextArea rows={3} placeholder="Укажите причину отклонения заявки" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
