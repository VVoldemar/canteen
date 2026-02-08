import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import type { Route } from "./+types/statistics";
import { ApiException } from "~/api/errors";
import {
  getAttendanceStatistics,
  getDishStatistics,
  getPaymentStatistics,
} from "~/api/statistics";
import { useAuth } from "~/context/AuthContext";
import type {
  AttendanceStatisticsByDay,
  DishStatistic,
  PaymentStatisticsResponse,
} from "~/types";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Статистика — Школьная столовая" }];
}

const formatAmount = (value?: number | null) => {
  if (typeof value !== "number") return "—";
  return `${(value / 100).toFixed(2)} ₽`;
};

const formatPercent = (value?: number | null) => {
  if (typeof value !== "number") return "—";
  return `${(value * 100).toFixed(1)}%`;
};

export default function StatisticsPage() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentStatisticsResponse | null>(
    null,
  );
  const [attendance, setAttendance] = useState<
    AttendanceStatisticsByDay[] | null
  >(null);
  const [attendanceTotals, setAttendanceTotals] = useState<{
    total_served: number;
    total_paid: number;
    attendance_rate: number;
  } | null>(null);
  const [dishStats, setDishStats] = useState<DishStatistic[]>([]);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    const params = {
      date_from: dateRange?.[0]?.format("YYYY-MM-DD"),
      date_to: dateRange?.[1]?.format("YYYY-MM-DD"),
    };

    try {
      const [paymentsResponse, attendanceResponse, dishesResponse] =
        await Promise.all([
          getPaymentStatistics(params),
          getAttendanceStatistics(params),
          getDishStatistics(params),
        ]);

      setPayments(paymentsResponse);
      setAttendance(attendanceResponse.by_date || []);
      setAttendanceTotals({
        total_served: attendanceResponse.total_served,
        total_paid: attendanceResponse.total_paid,
        attendance_rate: attendanceResponse.attendance_rate,
      });
      setDishStats(dishesResponse.dishes || []);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке статистики");
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, message]);

  useEffect(() => {
    if (user?.role === "admin") {
      loadStatistics();
    }
  }, [loadStatistics, user?.role]);

  const attendanceColumns = useMemo<ColumnsType<AttendanceStatisticsByDay>>(
    () => [
      { title: "Дата", dataIndex: "date" },
      { title: "Оплачено", dataIndex: "paid" },
      { title: "Выдано", dataIndex: "served" },
    ],
    [],
  );

  const dishColumns = useMemo<ColumnsType<DishStatistic>>(
    () => [
      {
        title: "Блюдо",
        dataIndex: ["dish", "name"],
      },
      {
        title: "Заказов",
        dataIndex: "orders_count",
        width: 120,
      },
      {
        title: "Отзывы",
        dataIndex: "reviews_count",
        width: 120,
      },
      {
        title: "Средняя оценка",
        dataIndex: "average_rating",
        render: (value: number | null | undefined) =>
          value ? <Tag color="gold">{value.toFixed(1)}</Tag> : "—",
        width: 160,
      },
    ],
    [],
  );

  if (!user || user.role !== "admin") {
    return (
      <div>
        <Title level={2}>Статистика</Title>
        <Empty description="Доступ только для администраторов" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Статистика
          </Title>
          <Text type="secondary">
            Платежи, посещаемость и популярность блюд
          </Text>
        </div>
        <Space>
          <RangePicker onChange={(value) => setDateRange(value)} />
          <Button onClick={loadStatistics} loading={loading}>
            Обновить
          </Button>
        </Space>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Платежи" loading={loading}>
          {payments ? (
            <Space direction="vertical" size="middle">
              <Statistic title="Сумма" value={formatAmount(payments.total_amount)} />
              <Statistic title="Заказов" value={payments.orders_count} />
              <Statistic
                title="Абонементов"
                value={payments.subscriptions_count}
              />
              <Statistic
                title="Средний чек"
                value={formatAmount(payments.average_order_amount)}
              />
              <Text type="secondary">
                Период: {payments.period?.from} — {payments.period?.to}
              </Text>
            </Space>
          ) : (
            <Text type="secondary">Нет данных</Text>
          )}
        </Card>

        <Card title="Посещаемость" loading={loading}>
          {attendanceTotals ? (
            <Space direction="vertical" size="middle">
              <Statistic
                title="Выдано"
                value={attendanceTotals.total_served}
              />
              <Statistic title="Оплачено" value={attendanceTotals.total_paid} />
              <Statistic
                title="Процент выдачи"
                value={formatPercent(attendanceTotals.attendance_rate)}
              />
            </Space>
          ) : (
            <Text type="secondary">Нет данных</Text>
          )}
        </Card>
      </div>

      <Card title="Посещаемость по дням" loading={loading}>
        <Table
          rowKey="date"
          columns={attendanceColumns}
          dataSource={attendance || []}
          pagination={false}
        />
      </Card>

      <Card title="Популярность блюд" loading={loading}>
        <Table
          rowKey={(record) => record.dish.id}
          columns={dishColumns}
          dataSource={dishStats}
          pagination={false}
        />
      </Card>
    </div>
  );
}
