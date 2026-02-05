import { Typography } from "antd";
import type { Route } from "./+types/notifications";

const { Title } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Уведомления — Школьная столовая" }];
}

export default function NotificationsPage() {
  return (
    <div>
      <Title level={2}>Уведомления</Title>
      <p>Ваши уведомления</p>
    </div>
  );
}
