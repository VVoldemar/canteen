import { useMemo } from "react";
import { Button, Popconfirm, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Order, OrderStatus } from "~/types";
import { statusColor, statusOptions } from "~/constants/orders";
import { formatDateTime } from "~/utils/date";
import { UserLink } from "~/components/UserLink";

interface OrdersTableProps {
  items: Order[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  canServe: boolean;
  canConfirm: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onViewDetails: (order: Order) => void;
  onServeOrder: (orderId: number) => void;
  onConfirmOrder: (orderId: number) => void;
  onCancelOrder: (orderId: number) => void;
}

export function OrdersTable({
  items,
  loading,
  page,
  pageSize,
  total,
  canServe,
  canConfirm,
  onPageChange,
  onViewDetails,
  onServeOrder,
  onConfirmOrder,
  onCancelOrder,
}: OrdersTableProps) {
  const columns = useMemo<ColumnsType<Order>>(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        width: 80,
      },
      {
        title: "Пользователь",
        dataIndex: "orderer",
        width: 140,
        render: (orderer) => <UserLink user={orderer} />,
      },
      {
        title: "Статус",
        dataIndex: "status",
        render: (value: OrderStatus) => (
          <Tag color={statusColor[value]}>
            {statusOptions.find((item) => item.value === value)?.label}
          </Tag>
        ),
      },
      {
        title: "Создан",
        dataIndex: "ordered_at",
        render: (value) => formatDateTime(value),
      },
      {
        title: "Завершен",
        dataIndex: "completed_at",
        render: (value) => formatDateTime(value),
      },
      {
        title: "Действия",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => onViewDetails(record)}>
              Подробнее
            </Button>
            {record.status === "paid" && canServe && (
              <Button type="link" onClick={() => onServeOrder(record.id)}>
                Выдать
              </Button>
            )}
            {record.status === "prepared" && canConfirm && (
              <Button type="link" onClick={() => onConfirmOrder(record.id)}>
                Подтвердить
              </Button>
            )}
            {["paid", "prepared"].includes(record.status) && (
              <Popconfirm
                title="Отменить заказ?"
                onConfirm={() => onCancelOrder(record.id)}
                okText="Отменить"
                cancelText="Назад"
              >
                <Button type="link" danger>
                  Отменить
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [canServe, canConfirm, onViewDetails, onServeOrder, onConfirmOrder, onCancelOrder],
  );

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={items}
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        showSizeChanger: true,
      }}
    />
  );
}
