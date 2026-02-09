import { useCallback, useEffect, useState } from "react";
import { App, Button, Card, Form, InputNumber, Space, Typography } from "antd";
import type { Route } from "./+types/subscriptions";
import { ApiException } from "~/api/errors";
import { getMySubscription, purchaseSubscription } from "~/api/subscriptions";
import type { Subscription } from "~/types";

const { Title, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Абонементы — Школьная столовая" }];
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
};

export default function SubscriptionsPage() {
  const { message } = App.useApp();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [form] = Form.useForm<{ days: number }>();

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMySubscription();
      setSubscription(response);
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.status === 404) {
          setSubscription(null);
        } else {
          message.error(error.error.message);
        }
      } else {
        message.error("Ошибка при загрузке абонемента");
      }
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const handlePurchase = async () => {
    try {
      const values = await form.validateFields();
      setPurchaseLoading(true);
      const response = await purchaseSubscription({ days: values.days });
      setSubscription(response);
      message.success("Абонемент приобретён");
      form.resetFields();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else if (error instanceof Error && error.message) {
        message.error(error.message);
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div>
        <Title level={2} className="!mb-0">
          Абонемент
        </Title>
        <Text type="secondary">
          Управление подпиской на школьное питание
        </Text>
      </div>

      <Card loading={loading} title="Текущий абонемент">
        {subscription ? (
          <Space direction="vertical">
            <Text>
              Статус:{" "}
              <Text strong>
                {subscription.is_active ? "Активен" : "Не активен"}
              </Text>
            </Text>
            <Text>Начало: {formatDate(subscription.subscription_start)}</Text>
            <Text>Дней в абонементе: {subscription.subscription_days}</Text>
            <Text>Осталось дней: {subscription.days_remaining}</Text>
          </Space>
        ) : (
          <Text type="secondary">Абонемент не активен</Text>
        )}
      </Card>

      <Card title="Купить абонемент">
        <Form form={form} layout="vertical">
          <Form.Item
            name="days"
            label="Количество дней"
            rules={[
              { required: true, message: "Введите количество дней" },
              { type: "number", min: 1, message: "Минимум 1 день" },
            ]}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Button
            type="primary"
            onClick={handlePurchase}
            loading={purchaseLoading}
          >
            Купить
          </Button>
        </Form>
      </Card>
    </div>
  );
}
