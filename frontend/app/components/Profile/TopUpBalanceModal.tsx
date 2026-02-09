import { useState } from "react";
import { Modal, InputNumber, Form, App } from "antd";
import { topUpBalance } from "~/api/users";
import { ApiException } from "~/api/errors";

interface TopUpBalanceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TopUpBalanceModal({
  open,
  onClose,
  onSuccess,
}: TopUpBalanceModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const amountInKopecks = Math.round(values.amount * 100);
      await topUpBalance(amountInKopecks);
      message.success("Баланс пополнен");
      form.resetFields();
      onClose();
      onSuccess();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось пополнить баланс");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Пополнить баланс"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="Пополнить"
      cancelText="Отмена"
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="amount"
          label="Сумма (₽)"
          rules={[
            { required: true, message: "Введите сумму" },
            {
              type: "number",
              min: 1,
              message: "Сумма должна быть больше 0",
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Введите сумму в рублях"
            min={1}
            step={10}
            precision={2}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
