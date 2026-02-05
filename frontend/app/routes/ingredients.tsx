import { Typography } from "antd";
import type { Route } from "./+types/ingredients";

const { Title } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Ингредиенты — Школьная столовая" }];
}

export default function IngredientsPage() {
  return (
    <div>
      <Title level={2}>Ингредиенты</Title>
      <p>Управление ингредиентами</p>
    </div>
  );
}
