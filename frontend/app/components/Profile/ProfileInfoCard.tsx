import { Card, Descriptions, Tag } from "antd";
import { red } from "@ant-design/colors";
import type { User } from "~/types";

interface ProfileInfoCardProps {
  user: User;
}

export function ProfileInfoCard({ user }: ProfileInfoCardProps) {
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

  return (
    <Card>
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Фамилия">{user.surname}</Descriptions.Item>
        <Descriptions.Item label="Имя">{user.name}</Descriptions.Item>
        <Descriptions.Item label="Отчество">
          {user.patronymic || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
        <Descriptions.Item label="Роль">{getRoleTag()}</Descriptions.Item>
        <Descriptions.Item label="Баланс">
          <span style={{ color: user.balance >= 0 ? undefined : red.primary }}>
            {formatBalance(user.balance || 0)}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="Статус">
          {!user.is_banned ? (
            <Tag color="green">Активен</Tag>
          ) : (
            <Tag color="red">Заблокирован</Tag>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
