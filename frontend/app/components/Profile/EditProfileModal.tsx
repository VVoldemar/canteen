import { useState } from "react";
import { Modal, Form, Input, Button, App } from "antd";
import { updateProfile } from "~/api/users";
import { ApiException } from "~/api/errors";
import type { UpdateUserRequest, User } from "~/types";

interface EditProfileModalProps {
  open: boolean;
  user: User;
  onClose: () => void;
  onUpdate: () => Promise<void>;
}

export function EditProfileModal({ open, user, onClose, onUpdate }: EditProfileModalProps) {
  const { message } = App.useApp();
  const [editLoading, setEditLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSaveProfile = async (values: UpdateUserRequest) => {
    setEditLoading(true);
    try {
      if (!values.password) {
        delete values.password;
      }
      await updateProfile(values);
      await onUpdate();
      message.success("Профиль обновлён");
      onClose();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при обновлении профиля");
      }
    } finally {
      setEditLoading(false);
    }
  };

  if (open && form.getFieldValue('name') !== user.name) {
    form.setFieldsValue({
      name: user.name,
      surname: user.surname,
      patronymic: user.patronymic || "",
    });
  }

  return (
    <Modal
      title="Редактирование профиля"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSaveProfile}
        className="mt-4"
      >
        <Form.Item
          name="surname"
          label="Фамилия"
          rules={[{ required: true, message: "Введите фамилию" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="name"
          label="Имя"
          rules={[{ required: true, message: "Введите имя" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="patronymic" label="Отчество">
          <Input />
        </Form.Item>

        <Form.Item
          name="password"
          label="Новый пароль"
          extra="Оставьте пустым, чтобы не менять"
        >
          <Input.Password />
        </Form.Item>

        <Form.Item className="mb-0 flex justify-end">
          <Button onClick={onClose} className="mr-2">
            Отмена
          </Button>
          <Button type="primary" htmlType="submit" loading={editLoading}>
            Сохранить
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
