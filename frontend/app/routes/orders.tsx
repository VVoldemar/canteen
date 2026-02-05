import { Typography } from "antd";
import type { Route } from "./+types/orders";

const { Title } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Заказы — Школьная столовая" }];
}

export default function OrdersPage() {
  return (
    <div>
      <Title level={2}>Заказы</Title>
      <p>История заказов</p>
    </div>
  );
}
