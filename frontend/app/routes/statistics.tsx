import { Typography } from "antd";
import type { Route } from "./+types/statistics";

const { Title } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Статистика — Школьная столовая" }];
}

export default function StatisticsPage() {
  return (
    <div>
      <Title level={2}>Статистика</Title>
      <p>Статистика по оплатам, посещаемости и блюдам</p>
    </div>
  );
}
