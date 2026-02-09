import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Route } from "./+types/menu";
import { ApiException } from "~/api/errors";
import {
  createMenu,
  deleteMenu,
  getMenu,
  getMenus,
  updateMenu,
} from "~/api/menu";
import { getDishes } from "~/api/dishes";
import { useAuth } from "~/context/AuthContext";
import type { Dish, Menu } from "~/types";

const { Title, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Меню — Школьная столовая" }];
}

export default function MenuPage() {
  const { user } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();

  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishesLoading, setDishesLoading] = useState(false);
  const [form] = Form.useForm();

  const canManage = user?.role === "admin";

  const loadMenus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMenus();
      setMenus(response);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке меню");
      }
    } finally {
      setLoading(false);
    }
  }, [message]);

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
    loadMenus();
  }, [loadMenus]);

  const openCreateModal = async () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
    await loadDishes();
  };

  const openEditModal = async (record: Menu) => {
    setEditing(record);
    form.resetFields();
    setModalOpen(true);
    await loadDishes();

    try {
      const menuDetail = await getMenu(record.id);
      form.setFieldsValue({
        name: menuDetail.name,
        dish_ids: menuDetail.items.map((item) => item.id),
      });
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось загрузить данные меню");
      }
    }
  };



  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editing) {
        await updateMenu(editing.id, values);
        message.success("Меню обновлено");
      } else {
        await createMenu(values);
        message.success("Меню создано");
      }

      setModalOpen(false);
      form.resetFields();
      await loadMenus();
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

  const handleDelete = async (record: Menu) => {
    try {
      await deleteMenu(record.id);
      message.success("Меню удалено");
      await loadMenus();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось удалить меню");
      }
    }
  };

  const columns = useMemo<ColumnsType<Menu>>(
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
        title: "Действия",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => navigate(`/menu/${record.id}`)}>
              Открыть
            </Button>
            {canManage && (
              <>
                <Button type="link" onClick={() => openEditModal(record)}>
                  Редактировать
                </Button>
                <Popconfirm
                  title="Удалить меню?"
                  onConfirm={() => handleDelete(record)}
                  okText="Удалить"
                  cancelText="Отмена"
                >
                  <Button type="link" danger>
                    Удалить
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        ),
      },
    ],
    [canManage, navigate],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Меню
          </Title>
          <Text type="secondary">Расписания и состав меню</Text>
        </div>
        <Space>
          <Button onClick={loadMenus}>Обновить</Button>
          {canManage && (
            <Button type="primary" onClick={openCreateModal}>
              Создать меню
            </Button>
          )}
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={menus}
        pagination={false}
      />

      <Modal
        open={modalOpen}
        title={editing ? "Редактировать меню" : "Новое меню"}
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
          <Form.Item name="dish_ids" label="Блюда">
            <Select
              mode="multiple"
              placeholder="Выберите блюда"
              loading={dishesLoading}
              options={dishes.map((dish) => ({
                label: dish.name,
                value: dish.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>


    </div>
  );
}
