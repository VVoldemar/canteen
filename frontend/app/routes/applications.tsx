import { Typography } from "antd";
import type { Route } from "./+types/applications";

const { Title } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Заявки — Школьная столовая" }];
}

export default function ApplicationsPage() {
  return (
    <div>
      <Title level={2}>Заявки на закупку</Title>
      <p>Заявки на закупку продуктов</p>
    </div>
  );
}
