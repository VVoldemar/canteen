import { Typography } from "antd";
import type { Route } from "./+types/dishes";

const { Title } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Блюда — Школьная столовая" }];
}

export default function DishesPage() {
  return (
    <div>
      <Title level={2}>Блюда</Title>
      <p>Управление блюдами (для поваров и администраторов)</p>
    </div>
  );
}
