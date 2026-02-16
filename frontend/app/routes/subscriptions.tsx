import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Popover,
  Space,
  Spin,
  Steps,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  ShoppingCartOutlined,
  CalendarOutlined,
  DollarOutlined,
  EyeOutlined,
  StopOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { Route } from "./+types/subscriptions";
import { ApiException } from "~/api/errors";
import {
  getMySubscription,
  purchaseSubscription,
  cancelSubscription,
} from "~/api/subscriptions";
import { getOrders, getOrder } from "~/api/orders";
import type { Order, OrderDetail, Subscription } from "~/types";
import { useAuth } from "~/context/AuthContext";
import { statusColor } from "~/constants/orders";

const { Title, Text } = Typography;

const formatPrice = (kopecks: number) => `${(kopecks / 100).toFixed(2)} ₽`;

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU");
};

const statusLabels: Record<string, string> = {
  paid: "Оплачен",
  prepared: "Готов к выдаче",
  served: "Выдан",
  cancelled: "Отменен",
};

export function meta({}: Route.MetaArgs) {
  return [{ title: "Абонемент — Школьная столовая" }];
}

function OrderPreviewPopover({
  orderId,
  children,
}: {
  orderId: number;
  children: React.ReactNode;
}) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const d = await getOrder(orderId);
      setDetail(d);
      setLoaded(true);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const content = loading ? (
    <Spin size="small" />
  ) : detail ? (
    <div style={{ maxWidth: 260 }}>
      {detail.dishes.map((item) => (
        <div
          key={item.dish.id}
          className="flex justify-between gap-4"
          style={{ padding: "2px 0" }}
        >
          <Text ellipsis style={{ maxWidth: 180 }}>
            {item.dish.name} × {item.quantity}
          </Text>
          <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
            {formatPrice(item.dish.price * item.quantity)}
          </Text>
        </div>
      ))}
      <div
        className="flex justify-between gap-4"
        style={{ borderTop: "1px solid #f0f0f0", marginTop: 4, paddingTop: 4 }}
      >
        <Text strong>Итого:</Text>
        <Text strong>
          {formatPrice(
            detail.dishes.reduce(
              (s, i) => s + i.dish.price * i.quantity,
              0,
            ),
          )}
        </Text>
      </div>
    </div>
  ) : (
    <Text type="secondary">Не удалось загрузить</Text>
  );

  return (
    <Popover
      content={content}
      title="Состав заказа"
      trigger="hover"
      onOpenChange={(open) => {
        if (open) load();
      }}
    >
      {children}
    </Popover>
  );
}

export default function SubscriptionsPage() {
  const { message } = App.useApp();
  const { user, refetchUser } = useAuth();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [days, setDays] = useState<number>(1);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);

  const hasActiveSubscription = subscription?.is_active === true;

  const loadSubscription = useCallback(async () => {
    setSubLoading(true);
    try {
      const response = await getMySubscription();
      setSubscription(response);
    } catch (error) {
      if (error instanceof ApiException && error.status === 404) {
        setSubscription(null);
      }
    } finally {
      setSubLoading(false);
    }
  }, []);

  const loadOrders = useCallback(
    async (page: number) => {
      setOrdersLoading(true);
      try {
        const response = await getOrders({
          page,
          limit: 50,
          user_id: user?.id,
        });
        setOrders(response.items);
        setOrdersTotal(response.total);
        setOrdersPage(page);
      } catch (error) {
        if (error instanceof ApiException) {
          message.error(error.error.message);
        } else {
          message.error("Ошибка при загрузке заказов");
        }
      } finally {
        setOrdersLoading(false);
      }
    },
    [message, user?.id],
  );

  const selectOrder = useCallback(
    async (orderId: number) => {
      setOrderDetailLoading(true);
      try {
        const detail = await getOrder(orderId);
        setSelectedOrder(detail);
      } catch (error) {
        if (error instanceof ApiException) {
          message.error(error.error.message);
        } else {
          message.error("Ошибка при загрузке деталей заказа");
        }
      } finally {
        setOrderDetailLoading(false);
      }
    },
    [message],
  );

  useEffect(() => {
    loadSubscription();
    loadOrders(1);
  }, [loadSubscription, loadOrders]);

  const orderCost = useMemo(() => {
    if (!selectedOrder) return 0;
    return selectedOrder.dishes.reduce(
      (sum, item) => sum + item.dish.price * item.quantity,
      0,
    );
  }, [selectedOrder]);

  const totalCost = orderCost * days;

  const currentStep = !selectedOrder ? 0 : 1;

  const handlePurchase = async () => {
    if (!selectedOrder) return;
    setPurchaseLoading(true);
    try {
      const response = await purchaseSubscription({
        id_order: selectedOrder.id,
        days,
      });
      setSubscription(response.subscription);
      message.success(
        `Абонемент оформлен! Создано заказов: ${response.created_orders}. Списано: ${formatPrice(response.total_cost)}`,
      );
      setSelectedOrder(null);
      setDays(1);
      setConfirmVisible(false);
      refetchUser();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const response = await cancelSubscription();
      setSubscription(null);
      message.success(
        `Абонемент отменён. Отменено заказов: ${response.cancelled_orders}. Возвращено: ${formatPrice(response.refunded)}`,
      );
      refetchUser();
      loadOrders(ordersPage);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div>
        <Title level={2} className="!mb-0">
          Абонемент
        </Title>
        <Text type="secondary">
          Оформите подписку на школьное питание — выберите заказ и количество
          дней
        </Text>
      </div>

      <Card
        loading={subLoading}
        title="Текущий абонемент"
        size="small"
        extra={
          hasActiveSubscription && (
            <Popconfirm
              title="Отменить абонемент?"
              description="Средства за оставшиеся дни будут возвращены на баланс."
              onConfirm={handleCancel}
              okText="Отменить абонемент"
              cancelText="Нет"
              okButtonProps={{ danger: true, loading: cancelLoading }}
            >
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                loading={cancelLoading}
              >
                Отменить
              </Button>
            </Popconfirm>
          )
        }
      >
        {subscription ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Статус">
              <Tag color={subscription.is_active ? "green" : "default"}>
                {subscription.is_active ? "Активен" : "Не активен"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Начало">
              {formatDate(subscription.subscription_start)}
            </Descriptions.Item>
            <Descriptions.Item label="Дней в абонементе">
              {subscription.subscription_days}
            </Descriptions.Item>
            <Descriptions.Item label="Осталось дней">
              {subscription.days_remaining}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Text type="secondary">Абонемент не активен</Text>
        )}
      </Card>

      <Card
        title="Оформить абонемент"
        extra={
          hasActiveSubscription && (
            <Tooltip title="Сначала отмените текущий абонемент">
              <InfoCircleOutlined style={{ color: "#faad14" }} />
            </Tooltip>
          )
        }
      >
        {hasActiveSubscription ? (
          <Text type="secondary">
            У вас уже есть активный абонемент. Чтобы оформить новый, сначала
            отмените текущий.
          </Text>
        ) : (
          <>
            <Steps
              current={currentStep}
              size="small"
              className="!mb-6"
              items={[
                {
                  title: "Выберите заказ",
                  icon: <ShoppingCartOutlined />,
                },
                {
                  title: "Настройте абонемент",
                  icon: <CalendarOutlined />,
                },
              ]}
            />

            {!selectedOrder && (
              <div>
                <Text type="secondary" className="!mb-3 block">
                  Выберите один из ваших прошлых заказов. Он будет повторяться каждый
                  будний день абонемента. Наведите на{" "}
                  <EyeOutlined /> чтобы посмотреть состав.
                </Text>
                <Spin spinning={ordersLoading}>
                  {orders.length === 0 && !ordersLoading ? (
                    <Empty description="У вас нет заказов" />
                  ) : (
                    <List
                      dataSource={orders}
                      pagination={{
                        current: ordersPage,
                        total: ordersTotal,
                        pageSize: 20,
                        size: "small",
                        onChange: (p) => loadOrders(p),
                      }}
                      renderItem={(order) => {
                        return (
                          <List.Item
                            className={`rounded-lg !px-3 transition-colors cursor-pointer hover:bg-gray-50`}
                            onClick={() =>
                              selectOrder(order.id)
                            }
                          >
                            <List.Item.Meta
                              title={
                                <Space>
                                  <Text strong>Заказ #{order.id}</Text>
                                  <Tag color={statusColor[order.status]}>
                                    {statusLabels[order.status] ?? order.status}
                                  </Tag>
                                  <OrderPreviewPopover orderId={order.id}>
                                    <EyeOutlined
                                      style={{
                                        color: "#1677ff",
                                        cursor: "pointer",
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </OrderPreviewPopover>
                                </Space>
                              }
                              description={formatDateTime(order.ordered_at)}
                            />
                              <Button
                                type="link"
                                loading={orderDetailLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectOrder(order.id);
                                }}
                              >
                                Выбрать
                              </Button>
                          </List.Item>
                        );
                      }}
                    />
                  )}
                </Spin>
              </div>
            )}

            {selectedOrder && (
              <div className="flex flex-col gap-4">
                <Card
                  type="inner"
                  size="small"
                  title={
                    <Space>
                      <Text strong>Заказ #{selectedOrder.id}</Text>
                      <Tag color={statusColor[selectedOrder.status]}>
                        {statusLabels[selectedOrder.status] ??
                          selectedOrder.status}
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Button
                      type="link"
                      onClick={() => setSelectedOrder(null)}
                    >
                      Изменить
                    </Button>
                  }
                >
                  <List
                    size="small"
                    dataSource={selectedOrder.dishes}
                    renderItem={(item) => (
                      <List.Item>
                        <Text>
                          {item.dish.name} × {item.quantity}
                        </Text>
                        <Text type="secondary">
                          {formatPrice(item.dish.price * item.quantity)}
                        </Text>
                      </List.Item>
                    )}
                    footer={
                      <div className="flex justify-between">
                        <Text strong>Стоимость заказа:</Text>
                        <Text strong>{formatPrice(orderCost)}</Text>
                      </div>
                    }
                  />
                </Card>

                <div className="flex flex-col gap-2">
                  <Text strong>Количество рабочих дней:</Text>
                  <InputNumber
                    min={1}
                    max={90}
                    value={days}
                    onChange={(v) => setDays(v ?? 1)}
                    className="!w-full"
                    addonAfter="дн."
                  />
                  <Text type="secondary">
                    Заказы будут созданы на {days}{" "}
                    {days === 1
                      ? "рабочий день"
                      : days < 5
                        ? "рабочих дня"
                        : "рабочих дней"}{" "}
                    вперёд.
                  </Text>
                </div>

                <Card type="inner" size="small">
                  <div className="flex justify-between items-center">
                    <Space orientation="vertical" size={0}>
                      <Text>
                        {formatPrice(orderCost)} × {days}{" "}
                        {days === 1
                          ? "день"
                          : days < 5
                            ? "дня"
                            : "дней"}
                      </Text>
                      <Text type="secondary">
                        Баланс: {formatPrice(user?.balance ?? 0)}
                      </Text>
                    </Space>
                    <Title level={4} className="!mb-0">
                      {formatPrice(totalCost)}
                    </Title>
                  </div>
                </Card>

                <Button
                  type="primary"
                  size="large"
                  icon={<DollarOutlined />}
                  onClick={() => setConfirmVisible(true)}
                  disabled={
                    totalCost === 0 || (user?.balance ?? 0) < totalCost
                  }
                  block
                >
                  {(user?.balance ?? 0) < totalCost
                    ? "Недостаточно средств"
                    : `Оформить абонемент за ${formatPrice(totalCost)}`}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        title="Подтверждение покупки абонемента"
        open={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onOk={handlePurchase}
        confirmLoading={purchaseLoading}
        okText="Подтвердить"
        cancelText="Отмена"
      >
        {selectedOrder && (
          <Space orientation="vertical" className="w-full">
            <Text>
              Заказ-шаблон: <Text strong>#{selectedOrder.id}</Text>
            </Text>
            <Text>
              Блюда:{" "}
              {selectedOrder.dishes
                .map((d) => `${d.dish.name} × ${d.quantity}`)
                .join(", ")}
            </Text>
            <Text>
              Рабочих дней: <Text strong>{days}</Text>
            </Text>
            <Text>
              Итого к списанию:{" "}
              <Text strong type="danger">
                {formatPrice(totalCost)}
              </Text>
            </Text>
          </Space>
        )}
      </Modal>
    </div>
  );
}
