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
import type { Route } from "./+types/ingredients";
import {
  createIngredient,
  deleteIngredient,
  getIngredients,
  updateIngredient,
} from "~/api/ingredients";
import { ApiException } from "~/api/errors";
import { useAuth } from "~/context/AuthContext";
import type {
  CreateIngredientRequest,
  Ingredient,
  Measure,
  UpdateIngredientRequest,
} from "~/types";

const { Title, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Ингредиенты — Школьная столовая" }];
}

const measureOptions: Array<{ label: string; value: Measure }> = [
  { label: "Кг", value: "Kg" },
  { label: "Л", value: "L" },
];

const formatPrice = (value: number) => `${(value / 100).toFixed(2)} ₽`;

export default function IngredientsPage() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form] = Form.useForm<CreateIngredientRequest>();

  const canManage = user?.role === "admin" || user?.role === "cook";
  const canDelete = user?.role === "admin";

  const loadIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getIngredients({ page, limit: pageSize });
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке ингредиентов");
      }
    } finally {
      setLoading(false);
    }
  }, [message, page, pageSize]);

  useEffect(() => {
    if (canManage) {
      loadIngredients();
    }
  }, [canManage, loadIngredients]);

  const openCreateModal = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record: Ingredient) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      price: record.price,
      measure: record.measure,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editing) {
        const payload: UpdateIngredientRequest = {
          name: values.name,
          price: values.price,
          measure: values.measure,
        };
        await updateIngredient(editing.id, payload);
        message.success("Ингредиент обновлен");
      } else {
        await createIngredient(values);
        message.success("Ингредиент создан");
      }

      setModalOpen(false);
      form.resetFields();
      await loadIngredients();
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

  const handleDelete = async (record: Ingredient) => {
    try {
      await deleteIngredient(record.id);
      message.success("Ингредиент удален");
      await loadIngredients();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось удалить ингредиент");
      }
    }
  };

  const columns = useMemo<ColumnsType<Ingredient>>(
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
        title: "Мера",
        dataIndex: "measure",
        render: (value: Measure) => (
          <Tag color={value === "Kg" ? "blue" : "green"}>
            {value === "Kg" ? "Кг" : "Л"}
          </Tag>
        ),
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
                title="Удалить ингредиент?"
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
        <Title level={2}>Ингредиенты</Title>
        <Empty description="Доступ только для администраторов и поваров" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Ингредиенты
          </Title>
          <Text type="secondary">
            Справочник ингредиентов и единиц измерения
          </Text>
        </div>
        <Space>
          <Button onClick={loadIngredients}>Обновить</Button>
          <Button type="primary" onClick={openCreateModal}>
            Добавить ингредиент
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
        title={editing ? "Редактировать ингредиент" : "Новый ингредиент"}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editing ? "Сохранить" : "Создать"}
        confirmLoading={saving}
      >
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
          <Form.Item
            name="measure"
            label="Ед. измерения"
            rules={[{ required: true, message: "Выберите единицу" }]}
          >
            <Select options={measureOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
