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
  Table,
  Tag,
  Typography,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Route } from "./+types/reviews";
import { ApiException } from "~/api/errors";
import { createReview, deleteReview, getReviews, updateReview } from "~/api/reviews";
import { getDishes } from "~/api/dishes";
import { useAuth } from "~/context/AuthContext";
import type {
  CreateReviewRequest,
  Dish,
  Review,
  UpdateReviewRequest,
} from "~/types";

const { Title, Text } = Typography;
const { TextArea } = Input;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Отзывы — Школьная столовая" }];
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU");
};

export default function ReviewsPage() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [dishFilter, setDishFilter] = useState<number | undefined>();

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishesLoading, setDishesLoading] = useState(false);
  const [form] = Form.useForm<CreateReviewRequest & { dish_id?: number }>();

  const canEditReview = (review: Review) => {
    if (!user) return false;
    return user.role === "admin" || user.id === review.user_id;
  };

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getReviews({
        page,
        limit: pageSize,
        dish_id: dishFilter,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке отзывов");
      }
    } finally {
      setLoading(false);
    }
  }, [dishFilter, message, page, pageSize]);

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
    loadReviews();
    loadDishes();
  }, [loadDishes, loadReviews]);

  const openCreateModal = async () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
    await loadDishes();
  };

  const openEditModal = async (review: Review) => {
    setEditing(review);
    form.resetFields();
    setModalOpen(true);
    await loadDishes();
    form.setFieldsValue({
      rating: review.rating ?? undefined,
      content: review.content ?? "",
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editing) {
        const payload: UpdateReviewRequest = {
          rating: values.rating,
          content: values.content,
        };
        await updateReview(editing.id, payload);
        message.success("Отзыв обновлен");
      } else {
        if (!values.dish_id) {
          message.error("Выберите блюдо");
          return;
        }
        await createReview(values.dish_id, {
          rating: values.rating,
          content: values.content,
        });
        message.success("Отзыв создан");
      }

      setModalOpen(false);
      form.resetFields();
      await loadReviews();
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

  const handleDelete = async (review: Review) => {
    try {
      await deleteReview(review.id);
      message.success("Отзыв удален");
      await loadReviews();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось удалить отзыв");
      }
    }
  };

  const columns = useMemo<ColumnsType<Review>>(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        width: 80,
      },
      {
        title: "Блюдо",
        dataIndex: "dish_id",
        render: (value) => {
          const dish = dishes.find((item) => item.id === value);
          return dish ? dish.name : value;
        },
      },
      {
        title: "Оценка",
        dataIndex: "rating",
        render: (value) => (value ? <Tag color="gold">{value}</Tag> : "—"),
        width: 120,
      },
      {
        title: "Комментарий",
        dataIndex: "content",
        render: (value) => value || "—",
      },
      {
        title: "Автор",
        dataIndex: "user_id",
        width: 120,
      },
      {
        title: "Дата",
        dataIndex: "datetime",
        render: (value) => formatDate(value),
        width: 180,
      },
      {
        title: "Действия",
        key: "actions",
        render: (_, record) => (
          <Space>
            {canEditReview(record) && (
              <Button type="link" onClick={() => openEditModal(record)}>
                Редактировать
              </Button>
            )}
            {canEditReview(record) && (
              <Popconfirm
                title="Удалить отзыв?"
                onConfirm={() => handleDelete(record)}
                okText="Удалить"
                cancelText="Отмена"
              >
                <Button type="link" danger>
                  Удалить
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [user, dishes],
  );

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Отзывы
          </Title>
          <Text type="secondary">Отзывы по блюдам</Text>
        </div>
        <Space>
          <Select
            allowClear
            placeholder="Фильтр по блюду"
            loading={dishesLoading}
            options={dishes.map((dish) => ({
              label: dish.name,
              value: dish.id,
            }))}
            onChange={(value) => {
              setPage(1);
              setDishFilter(value);
            }}
            style={{ width: 220 }}
          />
          <Button onClick={loadReviews}>Обновить</Button>
          <Button type="primary" onClick={openCreateModal}>
            Оставить отзыв
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
        title={editing ? "Редактировать отзыв" : "Новый отзыв"}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editing ? "Сохранить" : "Отправить"}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          {!editing && (
            <Form.Item
              name="dish_id"
              label="Блюдо"
              rules={[{ required: true, message: "Выберите блюдо" }]}
            >
              <Select
                placeholder="Выберите блюдо"
                loading={dishesLoading}
                options={dishes.map((dish) => ({
                  label: dish.name,
                  value: dish.id,
                }))}
              />
            </Form.Item>
          )}
          <Form.Item name="rating" label="Оценка">
            <InputNumber min={1} max={5} />
          </Form.Item>
          <Form.Item
            name="content"
            label="Комментарий"
            rules={[{ required: true, message: "Введите комментарий" }]}
          >
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
