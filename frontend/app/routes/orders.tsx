import { useCallback, useEffect, useState } from "react";
import { App, Typography } from "antd";
import type { Dayjs } from "dayjs";
import type { Route } from "./+types/orders";
import {
  cancelOrder,
  confirmOrderReceipt,
  getOrders,
  serveOrder,
} from "~/api/orders";
import { ApiException } from "~/api/errors";
import { useAuth } from "~/context/AuthContext";
import type { Order, OrderStatus } from "~/types";
import { OrdersFilters } from "~/components/Orders/OrdersFilters";
import { OrdersTable } from "~/components/Orders/OrdersTable";
import { OrderCreateModal } from "~/components/Orders/OrderCreateModal";
import { OrderDetailModal } from "~/components/Orders/OrderDetailModal";

const { Title, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Заказы — Школьная столовая" }];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [userIdFilter, setUserIdFilter] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const canCreate = user?.role === "admin";
  const canServe = user?.role === "admin" || user?.role === "cook";
  const canConfirm = user?.role === "admin" || user?.role === "student";

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getOrders({
        page,
        limit: pageSize,
        status: statusFilter,
        user_id: userIdFilter,
        date_from: dateRange?.[0]?.format("YYYY-MM-DD"),
        date_to: dateRange?.[1]?.format("YYYY-MM-DD"),
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке заказов");
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, message, page, pageSize, statusFilter, userIdFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openDetailModal = (order: Order) => {
    setSelectedOrderId(order.id);
    setDetailOpen(true);
  };

  const handleAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setSaving(true);
    try {
      await action();
      message.success(successMessage);
      await loadOrders();
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось выполнить действие");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Заказы
          </Title>
          <Text type="secondary">История и управление заказами</Text>
        </div>
        <OrdersFilters
          statusFilter={statusFilter}
          userIdFilter={userIdFilter}
          dateRange={dateRange}
          onStatusChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
          onUserIdChange={(value) => {
            setPage(1);
            setUserIdFilter(value);
          }}
          onDateRangeChange={(value) => {
            setPage(1);
            setDateRange(value);
          }}
          onRefresh={loadOrders}
          onCreateOrder={() => setModalOpen(true)}
          canCreate={canCreate}
          showUserFilter={user.role === "admin" || user.role === "cook"}
        />
      </div>

      <OrdersTable
        items={items}
        loading={loading || saving}
        page={page}
        pageSize={pageSize}
        total={total}
        canServe={canServe}
        canConfirm={canConfirm}
        onPageChange={(nextPage, nextPageSize) => {
          setPage(nextPage);
          if (nextPageSize !== pageSize) {
            setPageSize(nextPageSize);
          }
        }}
        onViewDetails={openDetailModal}
        onServeOrder={(orderId) =>
          handleAction(() => serveOrder(orderId), "Заказ готов к выдаче")
        }
        onConfirmOrder={(orderId) =>
          handleAction(
            () => confirmOrderReceipt(orderId),
            "Получение подтверждено",
          )
        }
        onCancelOrder={(orderId) =>
          handleAction(() => cancelOrder(orderId), "Заказ отменен")
        }
      />

      <OrderCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadOrders}
      />

      <OrderDetailModal
        open={detailOpen}
        orderId={selectedOrderId}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
