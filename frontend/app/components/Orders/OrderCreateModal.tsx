import { useCallback, useEffect, useState } from "react";
import { App, Button, Form, InputNumber, Modal, Select, Space, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getDishes } from "~/api/dishes";
import { createOrder } from "~/api/orders";
import { ApiException } from "~/api/errors";
import type { CreateOrderRequest, Dish } from "~/types";

const { Text } = Typography;

interface OrderCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderCreateModal({
  open,
  onClose,
  onSuccess,
}: OrderCreateModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateOrderRequest>();
  const [creating, setCreating] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishesLoading, setDishesLoading] = useState(false);

  const loadDishes = useCallback(async () => {
    if (dishes.length > 0) return;
    setDishesLoading(true);
    try {
      const response = await getDishes({ page: 1, limit: 100 });
      setDishes(response.items);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось загрузить блюда");
      }
    } finally {
      setDishesLoading(false);
    }
  }, [dishes.length, message]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldValue("dishes", [
        { dish_id: undefined, quantity: undefined },
      ]);
      loadDishes();
    }
  }, [open, form, loadDishes]);

  const handleCreateOrder = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await createOrder(values);
      message.success("Заказ создан");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else if (error instanceof Error && error.message) {
        message.error(error.message);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Новый заказ"
      onCancel={onClose}
      onOk={handleCreateOrder}
      okText="Создать"
      confirmLoading={creating}
      width={720}
    >
      <Form form={form} layout="vertical">
        <Form.List
          name="dishes"
          rules={[
            {
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  return Promise.reject(
                    new Error("Добавьте хотя бы одно блюдо"),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Text strong>Блюда</Text>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add()}
                  disabled={dishesLoading}
                >
                  Добавить
                </Button>
              </div>
              {fields.map((field) => (
                <Space key={field.key} align="baseline">
                  <Form.Item
                    {...field}
                    name={[field.name, "dish_id"]}
                    rules={[
                      { required: true, message: "Выберите блюдо" },
                    ]}
                  >
                    <Select
                      placeholder="Блюдо"
                      loading={dishesLoading}
                      options={dishes.map((dish) => ({
                        label: dish.name,
                        value: dish.id,
                      }))}
                      style={{ width: 260 }}
                    />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, "quantity"]}
                    rules={[
                      { required: true, message: "Введите количество" },
                    ]}
                  >
                    <InputNumber min={1} placeholder="Кол-во" />
                  </Form.Item>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                  />
                </Space>
              ))}
              <Form.ErrorList errors={errors} />
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
