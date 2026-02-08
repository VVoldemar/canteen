import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Form,
  Input,
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
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { Route } from "./+types/applications";
import { ApiException } from "~/api/errors";
import {
  approveApplication,
  createApplication,
  getApplication,
  getApplications,
  rejectApplication,
} from "~/api/applications";
import { getIngredients } from "~/api/ingredients";
import { useAuth } from "~/context/AuthContext";
import type {
  Application,
  ApplicationDetail,
  CreateApplicationRequest,
  Ingredient,
  OrderStatus,
} from "~/types";

const { Title, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Заявки — Школьная столовая" }];
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

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU");
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [currentRejectId, setCurrentRejectId] = useState<number | null>(null);
  const [form] = Form.useForm<CreateApplicationRequest>();
  const [rejectForm] = Form.useForm<{ reason: string }>();

  const canManage = user?.role === "admin" || user?.role === "cook";
  const canApprove = user?.role === "admin";

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getApplications({
        page,
        limit: pageSize,
        status: statusFilter,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке заявок");
      }
    } finally {
      setLoading(false);
    }
  }, [message, page, pageSize, statusFilter]);

  const loadIngredients = useCallback(async () => {
    if (ingredients.length > 0) return;
    setIngredientsLoading(true);
    try {
      const response = await getIngredients({ page: 1, limit: 100 });
      setIngredients(response.items);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось загрузить ингредиенты");
      }
    } finally {
      setIngredientsLoading(false);
    }
  }, [ingredients.length, message]);

  useEffect(() => {
    if (canManage) {
      loadApplications();
    }
  }, [canManage, loadApplications]);

  const openCreateModal = async () => {
    form.resetFields();
    form.setFieldValue("products", [
      { ingredient_id: undefined, quantity: undefined },
    ]);
    setModalOpen(true);
    await loadIngredients();
  };

  const openDetailModal = async (record: Application) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await getApplication(record.id);
      setDetail(data);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось загрузить заявку");
      }
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await createApplication(values);
      message.success("Заявка создана");
      setModalOpen(false);
      form.resetFields();
      await loadApplications();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else if (error instanceof Error && error.message) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: number) => {
    setSaving(true);
    try {
      await approveApplication(id);
      message.success("Заявка согласована");
      await loadApplications();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось согласовать заявку");
      }
    } finally {
      setSaving(false);
    }
  };

  const openRejectModal = (id: number) => {
    setCurrentRejectId(id);
    rejectForm.resetFields();
    setRejectOpen(true);
  };

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      if (!currentRejectId) return;
      setSaving(true);
      await rejectApplication(currentRejectId, { reason: values.reason });
      message.success("Заявка отклонена");
      setRejectOpen(false);
      setCurrentRejectId(null);
      await loadApplications();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else if (error instanceof Error && error.message) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<ColumnsType<Application>>(
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
        title: "Дата",
        dataIndex: "datetime",
        render: (value) => formatDate(value),
      },
      {
        title: "Действия",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => openDetailModal(record)}>
              Подробнее
            </Button>
            {canApprove && record.status === "paid" && (
              <>
                <Button type="link" onClick={() => handleApprove(record.id)}>
                  Согласовать
                </Button>
                <Button type="link" danger onClick={() => openRejectModal(record.id)}>
                  Отклонить
                </Button>
              </>
            )}
          </Space>
        ),
      },
    ],
    [canApprove],
  );

  if (!canManage) {
    return (
      <div>
        <Title level={2}>Заявки</Title>
        <Empty description="Доступ только для администраторов и поваров" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Заявки на закупку
          </Title>
          <Text type="secondary">Список заявок и их статус</Text>
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
          <Button onClick={loadApplications}>Обновить</Button>
          <Button type="primary" onClick={openCreateModal}>
            Создать заявку
          </Button>
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
        title="Новая заявка"
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        okText="Создать"
        confirmLoading={saving}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.List
            name="products"
            rules={[
              {
                validator: async (_, value) => {
                  if (!value || value.length < 1) {
                    return Promise.reject(
                      new Error("Добавьте хотя бы один ингредиент"),
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
                  <Text strong>Ингредиенты</Text>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add()}
                    disabled={ingredientsLoading}
                  >
                    Добавить
                  </Button>
                </div>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline">
                    <Form.Item
                      {...field}
                      name={[field.name, "ingredient_id"]}
                      rules={[
                        { required: true, message: "Выберите ингредиент" },
                      ]}
                    >
                      <Select
                        placeholder="Ингредиент"
                        loading={ingredientsLoading}
                        options={ingredients.map((ingredient) => ({
                          label: ingredient.name,
                          value: ingredient.id,
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
        title={`Заявка #${detail?.id ?? ""}`}
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
                  {statusOptions.find((item) => item.value === detail.status)?.label}
                </Tag>
              </Text>
              <Text>Дата: {formatDate(detail.datetime)}</Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text strong>Состав заявки</Text>
              {detail.products.length === 0 ? (
                <Empty description="Нет ингредиентов" />
              ) : (
                detail.products.map((item) => (
                  <div
                    key={`${item.ingredient.id}-${item.quantity}`}
                    className="flex items-center justify-between"
                  >
                    <Text>{item.ingredient.name}</Text>
                    <Text type="secondary">× {item.quantity}</Text>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <Text type="secondary">Заявка не найдена</Text>
        )}
      </Modal>

      <Modal
        open={rejectOpen}
        title="Отклонить заявку"
        onCancel={() => setRejectOpen(false)}
        onOk={handleReject}
        okText="Отклонить"
        confirmLoading={saving}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Причина"
            rules={[{ required: true, message: "Введите причину" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
