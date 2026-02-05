import { Typography } from "antd";
import type { Route } from "./+types/users";

const { Title } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Пользователи — Школьная столовая" }];
}

export default function UsersPage() {
  return (
    <div>
      <Title level={2}>Пользователи</Title>
      <p>Управление пользователями (только для администраторов)</p>
    </div>
  );
}
