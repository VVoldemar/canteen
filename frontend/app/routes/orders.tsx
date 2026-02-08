import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { Route } from "./+types/orders";
import {
  cancelOrder,
  confirmOrderReceipt,
  createOrder,
  getOrder,
  getOrders,
  serveOrder,
} from "~/api/orders";
import { getDishes } from "~/api/dishes";
import { ApiException } from "~/api/errors";
import { useAuth } from "~/context/AuthContext";
import type {
  CreateOrderRequest,
  Dish,
  Order,
  OrderDetail,
  OrderStatus,
} from "~/types";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Заказы — Школьная столовая" }];
}

const statusOptions: Array<{ label: string; value: OrderStatus }> = [
  { label: "Оплачен", value: "paid" },
  { label: "Выдан", value: "served" },
  { label: "Отменен", value: "cancelled" },
];

const statusColor: Record<OrderStatus, string> = {
  paid: "blue",
  served: "green",
  cancelled: "red",
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU");
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [userIdFilter, setUserIdFilter] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishesLoading, setDishesLoading] = useState(false);
  const [form] = Form.useForm<CreateOrderRequest>();

  const canCreate = user?.role === "admin" || user?.role === "student";
  const canServe = user?.role === "admin" || user?.role === "cook";
  const canConfirm = user?.role === "admin" || user?.role === "student";

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getOrders({
        page,
        limit: pageSize,
        status: statusFilter,
        user_id: userIdFilter,
        date_from: dateRange?.[0]?.toDate().toISOString(),
        date_to: dateRange?.[1]?.toDate().toISOString(),
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке заказов");
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, message, page, pageSize, statusFilter, userIdFilter]);

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
    loadOrders();
  }, [loadOrders]);

  const openCreateModal = async () => {
    form.resetFields();
    form.setFieldValue("dishes", [
      { dish_id: undefined, quantity: undefined },
    ]);
    setModalOpen(true);
    await loadDishes();
  };

  const openDetailModal = async (order: Order) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await getOrder(order.id);
      setDetail(data);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось загрузить заказ");
      }
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await createOrder(values);
      message.success("Заказ создан");
      setModalOpen(false);
      form.resetFields();
      await loadOrders();
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

  const handleAction = async (
    action: () => Promise<OrderDetail>,
    successMessage: string,
  ) => {
    setSaving(true);
    try {
      await action();
      message.success(successMessage);
      await loadOrders();
      if (detailOpen && detail) {
        const updated = await getOrder(detail.id);
        setDetail(updated);
      }
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось выполнить действие");
      }
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<ColumnsType<Order>>(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        width: 80,
      },
      {
        title: "Пользователь",
        dataIndex: "user_id",
        width: 140,
      },
      {
        title: "Статус",
        dataIndex: "status",
        render: (value: OrderStatus) => (
          <Tag color={statusColor[value]}>
            {statusOptions.find((item) => item.value === value)?.label}
          </Tag>
        ),
      },
      {
        title: "Создан",
        dataIndex: "ordered_at",
        render: (value) => formatDateTime(value),
      },
      {
        title: "Завершен",
        dataIndex: "completed_at",
        render: (value) => formatDateTime(value),
      },
      {
        title: "Действия",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => openDetailModal(record)}>
              Подробнее
            </Button>
            {record.status === "paid" && canServe && (
              <Button
                type="link"
                onClick={() =>
                  handleAction(
                    () => serveOrder(record.id),
                    "Заказ отмечен как выданный",
                  )
                }
              >
                Выдать
              </Button>
            )}
            {record.status === "paid" && canConfirm && (
              <Button
                type="link"
                onClick={() =>
                  handleAction(
                    () => confirmOrderReceipt(record.id),
                    "Получение подтверждено",
                  )
                }
              >
                Подтвердить
              </Button>
            )}
            {record.status !== "cancelled" && (
              <Popconfirm
                title="Отменить заказ?"
                onConfirm={() =>
                  handleAction(
                    () => cancelOrder(record.id),
                    "Заказ отменен",
                  )
                }
                okText="Отменить"
                cancelText="Назад"
              >
                <Button type="link" danger>
                  Отменить
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [canConfirm, canServe, detail, detailOpen],
  );

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Заказы
          </Title>
          <Text type="secondary">История и управление заказами</Text>
        </div>
        <Space>
          <Select
            allowClear
            placeholder="Статус"
            options={statusOptions}
            onChange={(value) => {
              setPage(1);
              setStatusFilter(value);
            }}
            style={{ width: 160 }}
          />
          {(user.role === "admin" || user.role === "cook") && (
            <InputNumber
              placeholder="ID пользователя"
              min={1}
              onChange={(value) => {
                setPage(1);
                setUserIdFilter(value ?? undefined);
              }}
            />
          )}
          <RangePicker
            onChange={(value) => {
              setPage(1);
              setDateRange(value);
            }}
          />
          <Button onClick={loadOrders}>Обновить</Button>
          {canCreate && (
            <Button type="primary" onClick={openCreateModal}>
              Создать заказ
            </Button>
          )}
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            if (nextPageSize && nextPageSize !== pageSize) {
              setPageSize(nextPageSize);
            }
          },
          showSizeChanger: true,
        }}
      />

      <Modal
        open={modalOpen}
        title="Новый заказ"
        onCancel={() => setModalOpen(false)}
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

      <Modal
        open={detailOpen}
        title={`Заказ #${detail?.id ?? ""}`}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Закрыть
          </Button>,
        ]}
        width={720}
      >
        {detailLoading ? (
          <div className="py-10 flex items-center justify-center">
            <Spin />
          </div>
        ) : detail ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Text>Пользователь: {detail.user_id}</Text>
              <Text>
                Статус:{" "}
                <Tag color={statusColor[detail.status]}>
                  {statusOptions.find((item) => item.value === detail.status)
                    ?.label}
                </Tag>
              </Text>
              <Text>Создан: {formatDateTime(detail.ordered_at)}</Text>
              <Text>Завершен: {formatDateTime(detail.completed_at)}</Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text strong>Состав заказа</Text>
              {detail.dishes.length === 0 ? (
                <Empty description="Нет блюд" />
              ) : (
                detail.dishes.map((item) => (
                  <div
                    key={`${item.dish.id}-${item.quantity}`}
                    className="flex items-center justify-between"
                  >
                    <Text>{item.dish.name}</Text>
                    <Text type="secondary">× {item.quantity}</Text>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <Text type="secondary">Заказ не найден</Text>
        )}
      </Modal>
    </div>
  );
}
