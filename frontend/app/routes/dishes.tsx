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
import type { Route } from "./+types/dishes";
import {
  createDish,
  deleteDish,
  getDish,
  getDishes,
  updateDish,
} from "~/api/dishes";
import { getIngredients } from "~/api/ingredients";
import { ApiException } from "~/api/errors";
import { useAuth } from "~/context/AuthContext";
import type {
  CreateDishRequest,
  Dish,
  DishDetail,
  Ingredient,
  UpdateDishRequest,
} from "~/types";

const { Title, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Блюда — Школьная столовая" }];
}

const formatPrice = (value: number) => `${(value / 100).toFixed(2)} ₽`;

export default function DishesPage() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [items, setItems] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [form] = Form.useForm<CreateDishRequest>();

  const canManage = user?.role === "admin" || user?.role === "cook";
  const canDelete = user?.role === "admin";

  const loadDishes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDishes({
        page,
        limit: pageSize,
        search: search || undefined,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке блюд");
      }
    } finally {
      setLoading(false);
    }
  }, [message, page, pageSize, search]);

  const loadIngredients = useCallback(async () => {
    if (ingredients.length > 0) return;
    setIngredientsLoading(true);
    try {
      const response = await getIngredients({ page: 1, limit: 200 });
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
      loadDishes();
    }
  }, [canManage, loadDishes]);

  const openCreateModal = async () => {
    setEditing(null);
    form.resetFields();
    form.setFieldValue("ingredients", [
      { ingredient_id: undefined, amount_thousandth_measure: undefined },
    ]);
    setModalOpen(true);
    await loadIngredients();
  };

  const openEditModal = async (record: Dish) => {
    setEditing(record);
    form.resetFields();
    setModalOpen(true);
    setDetailLoading(true);
    await loadIngredients();

    try {
      const detail: DishDetail = await getDish(record.id);
      form.setFieldsValue({
        name: detail.name,
        price: detail.price,
        ingredients: detail.ingredients.map((item) => ({
          ingredient_id: item.ingredient.id,
          amount_thousandth_measure: item.amount_thousandth_measure,
        })),
      });
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось загрузить данные блюда");
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editing) {
        const payload: UpdateDishRequest = {
          name: values.name,
          price: values.price,
          ingredients: values.ingredients,
        };
        await updateDish(editing.id, payload);
        message.success("Блюдо обновлено");
      } else {
        await createDish(values);
        message.success("Блюдо создано");
      }

      setModalOpen(false);
      form.resetFields();
      await loadDishes();
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

  const handleDelete = async (record: Dish) => {
    try {
      await deleteDish(record.id);
      message.success("Блюдо удалено");
      await loadDishes();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось удалить блюдо");
      }
    }
  };

  const columns = useMemo<ColumnsType<Dish>>(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        width: 80,
      },
      {
        title: "Название",
        dataIndex: "name",
      },
      {
        title: "Цена",
        dataIndex: "price",
        render: (value) => formatPrice(value),
      },
      {
        title: "Действия",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => openEditModal(record)}>
              Редактировать
            </Button>
            {canDelete && (
              <Popconfirm
                title="Удалить блюдо?"
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
    [canDelete],
  );

  if (!canManage) {
    return (
      <div>
        <Title level={2}>Блюда</Title>
        <Empty description="Доступ только для администраторов и поваров" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Блюда
          </Title>
          <Text type="secondary">Каталог блюд и их состав</Text>
        </div>
        <Space>
          <Input.Search
            placeholder="Поиск по названию"
            allowClear
            onSearch={(value) => {
              setPage(1);
              setSearch(value);
            }}
            style={{ width: 240 }}
          />
          <Button onClick={loadDishes}>Обновить</Button>
          <Button type="primary" onClick={openCreateModal}>
            Добавить блюдо
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
        title={editing ? "Редактировать блюдо" : "Новое блюдо"}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editing ? "Сохранить" : "Создать"}
        confirmLoading={saving}
        width={720}
      >
        {detailLoading ? (
          <div className="py-10 flex items-center justify-center">
            <Spin />
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Название"
              rules={[{ required: true, message: "Введите название" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="price"
              label="Цена (коп.)"
              rules={[{ required: true, message: "Введите цену" }]}
            >
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.List
              name="ingredients"
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
                          {
                            required: true,
                            message: "Выберите ингредиент",
                          },
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
                        name={[field.name, "amount_thousandth_measure"]}
                        rules={[
                          {
                            required: true,
                            message: "Введите количество",
                          },
                        ]}
                      >
                        <InputNumber min={1} placeholder="Кол-во (тысячн.)" />
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
        )}
      </Modal>
    </div>
  );
}
