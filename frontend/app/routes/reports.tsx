import { Typography } from "antd";
import type { Route } from "./+types/reports";

const { Title } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Отчёты — Школьная столовая" }];
}

export default function ReportsPage() {
  return (
    <div>
      <Title level={2}>Отчёты</Title>
      <p>Формирование отчётов по затратам и питанию</p>
    </div>
  );
}
