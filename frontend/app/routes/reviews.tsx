import { Typography } from "antd";
import type { Route } from "./+types/reviews";

const { Title } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Отзывы — Школьная столовая" }];
}

export default function ReviewsPage() {
  return (
    <div>
      <Title level={2}>Отзывы</Title>
      <p>Отзывы о блюдах</p>
    </div>
  );
}
