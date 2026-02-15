import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Empty,
  InputNumber,
  Popconfirm,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Route } from "./+types/users";
import { getUsers, updateUserAdmin, updateUserBalance } from "~/api/users";
import { ApiException } from "~/api/errors";
import { useAuth } from "~/context/AuthContext";
import { UserLink } from "~/components/UserLink";
import type { User, UserRole } from "~/types";

const { Title, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Пользователи — Школьная столовая" }];
}

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "Ученик", value: "student" },
  { label: "Повар", value: "cook" },
  { label: "Администратор", value: "admin" },
];

type RoleFilter = UserRole | "all";

const normalizeUser = (user: User): User => {
  if (user.is_banned === undefined && typeof user.banned === "boolean") {
    return { ...user, is_banned: user.banned };
  }
  return user;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { message } = App.useApp();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [updatingIds, setUpdatingIds] = useState<number[]>([]);
  const [balanceInputs, setBalanceInputs] = useState<
    Record<number, number | undefined>
  >({});

  const isUpdating = useCallback(
    (id: number) => updatingIds.includes(id),
    [updatingIds],
  );

  const setUpdating = (id: number, state: boolean) => {
    setUpdatingIds((prev) => {
      if (state) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUsers({
        page,
        limit: pageSize,
        role: roleFilter === "all" ? undefined : roleFilter,
        search: debouncedSearchQuery || undefined,
      });
      setUsers(response.items.map(normalizeUser));
      setTotal(response.total);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке пользователей");
      }
    } finally {
      setLoading(false);
    }
  }, [message, page, pageSize, roleFilter, debouncedSearchQuery]);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadUsers();
    }
  }, [currentUser?.role, loadUsers]);

  const handleRoleChange = async (record: User, role: UserRole) => {
    if (record.role === role) return;
    setUpdating(record.id, true);
    try {
      const updated = await updateUserAdmin(record.id, { role });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === record.id ? normalizeUser(updated) : item,
        ),
      );
      message.success("Роль обновлена");
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось обновить роль");
      }
    } finally {
      setUpdating(record.id, false);
    }
  };

  const handleBanChange = async (record: User, banned: boolean) => {
    setUpdating(record.id, true);
    try {
      const updated = await updateUserAdmin(record.id, { banned });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === record.id ? normalizeUser(updated) : item,
        ),
      );
      message.success(banned ? "Пользователь заблокирован" : "Пользователь активирован");
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось изменить статус");
      }
    } finally {
      setUpdating(record.id, false);
    }
  };

  const handleBalanceUpdate = async (record: User) => {
    const amount = balanceInputs[record.id];
    if (amount === undefined || amount === 0) {
      message.warning("Введите сумму");
      return;
    }

    setUpdating(record.id, true);
    try {
      const amountInKopecks = Math.round(amount * 100);
      const updated = await updateUserBalance(record.id, amountInKopecks);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === record.id ? normalizeUser(updated) : item,
        ),
      );
      setBalanceInputs((prev) => {
        const next = { ...prev };
        delete next[record.id];
        return next;
      });
      message.success("Баланс обновлен");
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось обновить баланс");
      }
    } finally {
      setUpdating(record.id, false);
    }
  };

  const formatBalance = (kopecks: number) => {
    return (kopecks / 100).toFixed(2) + " ₽";
  };

  const columns = useMemo<ColumnsType<User>>(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        width: 80,
      },
      {
        title: "ФИО",
        dataIndex: "surname",
        render: (_, record) => (
          <UserLink
            user={{
              id: record.id,
              name: record.name,
              surname: record.surname,
              patronymic: record.patronymic,
            }}
          />
        ),
      },
      {
        title: "Роль",
        dataIndex: "role",
        width: 220,
        render: (_, record) => (
          <Select
            value={record.role}
            options={roleOptions}
            onChange={(value) => handleRoleChange(record, value)}
            disabled={isUpdating(record.id)}
          />
        ),
      },
      {
        title: "Статус",
        dataIndex: "banned",
        width: 180,
        render: (_, record) => {
          const banned = record.banned ?? record.is_banned ?? false;
          return (
            <Space>
              <Switch
                checked={!banned}
                onChange={(checked) => handleBanChange(record, !checked)}
                disabled={isUpdating(record.id)}
              />
              <Tag color={banned ? "red" : "green"}>
                {banned ? "Заблокирован" : "Активен"}
              </Tag>
            </Space>
          );
        },
      },
      {
        title: "Регистрация",
        dataIndex: "registered_at",
        render: (value) => formatDate(value),
      },
      {
        title: "Баланс",
        dataIndex: "balance",
        width: 280,
        render: (_, record) => {
          const balance =
            typeof record.balance === "number" ? record.balance : 0;
          return (
            <Space.Compact style={{ width: "100%" }}>
              <InputNumber
                style={{ flex: 1 }}
                placeholder={formatBalance(balance)}
                value={balanceInputs[record.id]}
                onChange={(value) => {
                  setBalanceInputs((prev) => ({
                    ...prev,
                    [record.id]: value ?? undefined,
                  }));
                }}
                step={10}
                precision={2}
                disabled={isUpdating(record.id)}
              />
              <Popconfirm
                title="Изменить баланс?"
                description={`Добавить ${balanceInputs[record.id] ?? 0} ₽`}
                onConfirm={() => handleBalanceUpdate(record)}
                okText="Да"
                cancelText="Отмена"
                disabled={
                  isUpdating(record.id) ||
                  balanceInputs[record.id] === undefined ||
                  balanceInputs[record.id] === null ||
                  balanceInputs[record.id] === 0
                }
              >
                <Button
                  type="primary"
                  disabled={
                    isUpdating(record.id) ||
                    balanceInputs[record.id] === undefined ||
                    balanceInputs[record.id] === null ||
                    balanceInputs[record.id] === 0
                  }
                >
                  Пополнить
                </Button>
              </Popconfirm>
            </Space.Compact>
          );
        },
      },
      {
        title: "Подписка (дней)",
        dataIndex: "subscription_days",
        render: (value) => (typeof value === "number" ? value : "—"),
      },
    ],
    [isUpdating, balanceInputs],
  );

  if (!currentUser) {
    return null;
  }

  if (currentUser.role !== "admin") {
    return (
      <div>
        <Title level={2}>Пользователи</Title>
        <Empty description="Доступ только для администраторов" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Пользователи
          </Title>
          <Text type="secondary">
            Управление пользователями, ролями и статусами
          </Text>
        </div>
        <Space>
          <Input.Search
            placeholder="Поиск по ID или ФИО..."
            allowClear
            // enterButton
            style={{ width: 300 }}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={roleFilter}
            onChange={(value) => {
              setPage(1);
              setRoleFilter(value);
            }}
            options={[
              { label: "Все роли", value: "all" },
              ...roleOptions,
            ]}
          />
          <Button onClick={loadUsers}>Обновить</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={users}
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
    </div>
  );
}
