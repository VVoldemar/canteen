import { useCallback, useEffect, useState } from "react";
import { App, Button, Card, Empty, Space, Tag, Typography } from "antd";
import type { Route } from "./+types/notifications";
import { ApiException } from "~/api/errors";
import { getNotifications } from "~/api/notifications";
import type { Notification } from "~/types";

const { Title, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Уведомления — Школьная столовая" }];
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU");
};

export default function NotificationsPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getNotifications();
      setItems(response);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке уведомлений");
      }
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Уведомления
          </Title>
          <Text type="secondary">Лента событий и изменений</Text>
        </div>
        <Space>
          <Button onClick={loadNotifications} loading={loading}>
            Обновить
          </Button>
        </Space>
      </div>

      {items.length === 0 ? (
        <Empty description="Нет уведомлений" />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id} loading={loading}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Text strong>{item.title}</Text>
                  <Tag color={item.read ? "default" : "blue"}>
                    {item.read ? "Прочитано" : "Новое"}
                  </Tag>
                </div>
                <Text>{item.body}</Text>
                <Text type="secondary">{formatDate(item.created_at)}</Text>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
