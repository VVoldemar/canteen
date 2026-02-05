import { Typography } from "antd";
import type { Route } from "./+types/menu";

const { Title } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Меню — Школьная столовая" }];
}

export default function MenuPage() {
  return (
    <div>
      <Title level={2}>Меню</Title>
      <p>Здесь будет список меню на разные дни</p>
    </div>
  );
}
