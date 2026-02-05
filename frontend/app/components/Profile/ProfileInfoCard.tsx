import { Card, Descriptions, Tag } from "antd";
import { red } from "@ant-design/colors";
import type { User } from "~/types";

interface ProfileInfoCardProps {
  user: User;
}

export function ProfileInfoCard({ user }: ProfileInfoCardProps) {
  const banned = user.banned ?? user.is_banned ?? false;

  const getRoleTag = () => {
    switch (user.role) {
      case "admin":
        return <Tag color="red">Администратор</Tag>;
      case "cook":
        return <Tag color="orange">Повар</Tag>;
      case "student":
        return <Tag color="blue">Ученик</Tag>;
      default:
        return <Tag>{user.role}</Tag>;
    }
  };

  const formatBalance = (kopecks: number) => {
    return (kopecks / 100).toFixed(2) + " ₽";
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("ru-RU");
  };

  return (
    <Card>
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Фамилия">{user.surname}</Descriptions.Item>
        <Descriptions.Item label="Имя">{user.name}</Descriptions.Item>
        <Descriptions.Item label="Отчество">
          {user.patronymic || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Email">{user.email || "—"}</Descriptions.Item>
        <Descriptions.Item label="Роль">{getRoleTag()}</Descriptions.Item>
        {typeof user.balance === "number" && (
          <Descriptions.Item label="Баланс">
            <span
              style={{
                color: user.balance >= 0 ? undefined : red.primary,
              }}
            >
              {formatBalance(user.balance)}
            </span>
          </Descriptions.Item>
        )}
        {user.registered_at && (
          <Descriptions.Item label="Дата регистрации">
            {formatDate(user.registered_at)}
          </Descriptions.Item>
        )}
        {typeof user.subscription_days === "number" && (
          <Descriptions.Item label="Подписка (дней)">
            {user.subscription_days}
          </Descriptions.Item>
        )}
        {user.subscription_start && (
          <Descriptions.Item label="Начало подписки">
            {formatDate(user.subscription_start)}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Статус">
          {!banned ? (
            <Tag color="green">Активен</Tag>
          ) : (
            <Tag color="red">Заблокирован</Tag>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
