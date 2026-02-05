import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Space,
  Table,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import type { Route } from "./+types/reports";
import { ApiException } from "~/api/errors";
import { getCostsReport, getNutritionReport } from "~/api/reports";
import { useAuth } from "~/context/AuthContext";
import type { NutritionDishBreakdown } from "~/types";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Отчёты — Школьная столовая" }];
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
};

const formatAmount = (value?: number | null) => {
  if (typeof value !== "number") return "—";
  return `${(value / 100).toFixed(2)} ₽`;
};

export default function ReportsPage() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [costs, setCosts] = useState<{
    from: string;
    to: string;
    procurement_applications: number;
    estimated_total_cost_kopecks: number;
  } | null>(null);
  const [nutrition, setNutrition] = useState<{
    from: string;
    to: string;
    served_orders: number;
    dishes_breakdown: NutritionDishBreakdown[];
  } | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const params = {
      date_from: dateRange?.[0]?.format("YYYY-MM-DD"),
      date_to: dateRange?.[1]?.format("YYYY-MM-DD"),
    };

    try {
      const [costsResponse, nutritionResponse] = await Promise.all([
        getCostsReport(params),
        getNutritionReport(params),
      ]);
      setCosts(costsResponse);
      setNutrition(nutritionResponse);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке отчётов");
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, message]);

  useEffect(() => {
    if (user?.role === "admin") {
      loadReports();
    }
  }, [loadReports, user?.role]);

  const breakdownColumns: ColumnsType<NutritionDishBreakdown> = [
    {
      title: "Блюдо",
      dataIndex: "dish_name",
    },
    {
      title: "Количество",
      dataIndex: "quantity",
      width: 160,
    },
  ];

  if (!user || user.role !== "admin") {
    return (
      <div>
        <Title level={2}>Отчёты</Title>
        <Empty description="Доступ только для администраторов" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Отчёты
          </Title>
          <Text type="secondary">Финансовые и продуктовые отчёты</Text>
        </div>
        <Space>
          <RangePicker onChange={(value) => setDateRange(value)} />
          <Button onClick={loadReports} loading={loading}>
            Обновить
          </Button>
        </Space>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Отчёт по затратам" loading={loading}>
          {costs ? (
            <Space direction="vertical" size="middle">
              <Text>
                Период: {formatDate(costs.from)} — {formatDate(costs.to)}
              </Text>
              <Text>
                Заявок: <Text strong>{costs.procurement_applications}</Text>
              </Text>
              <Text>
                Оценка затрат:{" "}
                <Text strong>{formatAmount(costs.estimated_total_cost_kopecks)}</Text>
              </Text>
            </Space>
          ) : (
            <Text type="secondary">Нет данных</Text>
          )}
        </Card>

        <Card title="Отчёт по питанию" loading={loading}>
          {nutrition ? (
            <Space direction="vertical" size="middle">
              <Text>
                Период: {formatDate(nutrition.from)} — {formatDate(nutrition.to)}
              </Text>
              <Text>
                Выдано заказов: <Text strong>{nutrition.served_orders}</Text>
              </Text>
            </Space>
          ) : (
            <Text type="secondary">Нет данных</Text>
          )}
        </Card>
      </div>

      <Card title="Состав отчёта по питанию" loading={loading}>
        <Table
          rowKey={(record) => record.dish_id}
          columns={breakdownColumns}
          dataSource={nutrition?.dishes_breakdown || []}
          pagination={false}
        />
      </Card>
    </div>
  );
}
