import { useEffect, useState } from "react";
import { App, Button, Empty, Modal, Spin, Tag, Typography } from "antd";
import { getOrder } from "~/api/orders";
import { ApiException } from "~/api/errors";
import type { OrderDetail } from "~/types";
import { statusColor, statusOptions } from "~/constants/orders";
import { formatDateTime } from "~/utils/date";

const { Text } = Typography;

interface OrderDetailModalProps {
  open: boolean;
  orderId: number | null;
  onClose: () => void;
}

export function OrderDetailModal({
  open,
  orderId,
  onClose,
}: OrderDetailModalProps) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  useEffect(() => {
    if (open && orderId) {
      setLoading(true);
      getOrder(orderId)
        .then((data) => setDetail(data))
        .catch((error) => {
          if (error instanceof ApiException) {
            message.error(error.error.message);
          } else {
            message.error("Не удалось загрузить заказ");
          }
          setDetail(null);
        })
        .finally(() => setLoading(false));
    }
  }, [open, orderId, message]);

  return (
    <Modal
      open={open}
      title={`Заказ #${detail?.id ?? ""}`}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Закрыть
        </Button>,
      ]}
      width={720}
    >
      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <Spin />
        </div>
      ) : detail ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Text>Пользователь: {detail.user_id}</Text>
            <Text>
              Статус:{" "}
              <Tag color={statusColor[detail.status]}>
                {statusOptions.find((item) => item.value === detail.status)
                  ?.label}
              </Tag>
            </Text>
            <Text>Создан: {formatDateTime(detail.ordered_at)}</Text>
            <Text>Завершен: {formatDateTime(detail.completed_at)}</Text>
          </div>
          <div className="flex flex-col gap-2">
            <Text strong>Состав заказа</Text>
            {detail.dishes.length === 0 ? (
              <Empty description="Нет блюд" />
            ) : (
              detail.dishes.map((item) => (
                <div
                  key={`${item.dish.id}-${item.quantity}`}
                  className="flex items-center justify-between"
                >
                  <Text>{item.dish.name}</Text>
                  <Text type="secondary">× {item.quantity}</Text>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <Text type="secondary">Заказ не найден</Text>
      )}
    </Modal>
  );
}
