import {
  App,
  Badge,
  Button,
  Drawer,
  Empty,
  InputNumber,
  List,
  Modal,
  Space,
  Typography,
} from "antd";
import {
  ShoppingCartOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useCart } from "~/context/CartContext";
import { createOrder } from "~/api/orders";
import { ApiException } from "~/api/errors";

const { Title, Text } = Typography;

export function CartButton() {
  const [open, setOpen] = useState(false);
  const { items, getTotalItems } = useCart();

  return (
    <>
      <Badge count={getTotalItems()} offset={[-5, 5]}>
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => setOpen(true)}
          size="large"
        >
          Корзина
        </Button>
      </Badge>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

function CartDrawer({ open, onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice } =
    useCart();
  const [creating, setCreating] = useState(false);

  const handleOrder = async () => {
    if (items.length === 0) {
      message.warning("Корзина пуста");
      return;
    }

    Modal.confirm({
      title: "Подтвердите заказ",
      content: (
        <div>
          <p>Вы уверены, что хотите оформить заказ?</p>
          <p>
            <Text strong>Итого: </Text>
            <Text strong style={{ color: "#52c41a" }}>
              {(getTotalPrice() / 100).toFixed(2)} ₽
            </Text>
          </p>
        </div>
      ),
      okText: "Оформить",
      cancelText: "Отмена",
      onOk: async () => {
        setCreating(true);
        try {
          const orderData = {
            dishes: items.map((item) => ({
              dish_id: item.dish.id,
              quantity: item.quantity,
            })),
          };

          const order = await createOrder(orderData);

          Modal.success({
            title: "Заказ оформлен!",
            content: (
              <div>
                <p>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} /> Ваш
                  заказ #{order.id} успешно создан
                </p>
                <p>
                  Сумма: {(getTotalPrice() / 100).toFixed(2)} ₽
                </p>
                <p>Статус: {getStatusText(order.status)}</p>
              </div>
            ),
            onOk: () => {
              clearCart();
              onClose();
              navigate("/orders");
            },
          });
        } catch (error) {
          if (error instanceof ApiException) {
            message.error(error.error.message);
          } else {
            message.error("Не удалось оформить заказ");
          }
        } finally {
          setCreating(false);
        }
      },
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Оплачен";
      case "prepared":
        return "Готов к выдаче";
      case "served":
        return "Выдан";
      case "cancelled":
        return "Отменён";
      default:
        return status;
    }
  };

  return (
    <Drawer
      title="Корзина"
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      footer={
        items.length > 0 && (
          <Space orientation="vertical" style={{ width: "100%" }} size="middle">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong style={{ fontSize: 18 }}>
                Итого:
              </Text>
              <Text strong style={{ fontSize: 20, color: "#52c41a" }}>
                {(getTotalPrice() / 100).toFixed(2)} ₽
              </Text>
            </div>
            <Space style={{ width: "100%" }}>
              <Button
                block
                type="primary"
                size="large"
                onClick={handleOrder}
                loading={creating}
              >
                Оформить заказ
              </Button>
              <Button onClick={clearCart} size="large">
                Очистить
              </Button>
            </Space>
          </Space>
        )
      }
    >
      {items.length === 0 ? (
        <Empty description="Корзина пуста" />
      ) : (
        <List
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              key={item.dish.id}
              actions={[
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeFromCart(item.dish.id)}
                />,
              ]}
            >
              <List.Item.Meta
                title={item.dish.name}
                description={
                  <Space orientation="vertical" size="small">
                    <Text type="secondary">
                      {(item.dish.price / 100).toFixed(2)} ₽ × {item.quantity}
                    </Text>
                    <Space>
                      <Text>Количество:</Text>
                      <InputNumber
                        min={1}
                        max={99}
                        value={item.quantity}
                        onChange={(value) =>
                          updateQuantity(item.dish.id, value || 1)
                        }
                        size="small"
                        style={{ width: 60 }}
                      />
                    </Space>
                    <Text strong style={{ color: "#52c41a" }}>
                      Сумма:{" "}
                      {((item.dish.price * item.quantity) / 100).toFixed(2)} ₽
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
}
