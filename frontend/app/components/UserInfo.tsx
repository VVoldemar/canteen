import { Descriptions, Tag } from "antd";
import { red } from "@ant-design/colors";
import type { User } from "~/types";

interface UserInfoProps {
  user: User;
  size?: "small" | "middle" | "default";
  showAllergies?: boolean;
}

const getRoleTag = (role: string) => {
  switch (role) {
    case "admin":
      return <Tag color="red">Администратор</Tag>;
    case "cook":
      return <Tag color="orange">Повар</Tag>;
    case "student":
      return <Tag color="blue">Ученик</Tag>;
    default:
      return <Tag>{role}</Tag>;
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

export function UserInfo({ user, size = "small", showAllergies = false }: UserInfoProps) {
  const banned = user.banned ?? user.is_banned ?? false;

  return (
    <Descriptions column={1} bordered size={size}>
      <Descriptions.Item label="Фамилия">{user.surname}</Descriptions.Item>
      <Descriptions.Item label="Имя">{user.name}</Descriptions.Item>
      <Descriptions.Item label="Отчество">
        {user.patronymic || "—"}
      </Descriptions.Item>
      <Descriptions.Item label="Email">{user.email || "—"}</Descriptions.Item>
      <Descriptions.Item label="Роль">{getRoleTag(user.role)}</Descriptions.Item>
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
      {showAllergies && user.allergies && user.allergies.length > 0 && (
        <Descriptions.Item label="Аллергии">
          {user.allergies.map((allergy) => (
            <Tag key={allergy.id}>{allergy.name}</Tag>
          ))}
        </Descriptions.Item>
      )}
    </Descriptions>
  );
}
