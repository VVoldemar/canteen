import { Typography } from "antd";
import type { Route } from "./+types/subscriptions";

const { Title } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Абонементы — Школьная столовая" }];
}

export default function SubscriptionsPage() {
  return (
    <div>
      <Title level={2}>Абонементы</Title>
      <p>Управление абонементами на питание</p>
    </div>
  );
}
