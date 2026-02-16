import type { OrderStatus } from "~/types";

export const statusOptions: Array<{ label: string; value: OrderStatus }> = [
  { label: "Оплачен", value: "paid" },
  { label: "Готов к выдаче", value: "prepared" },
  { label: "Выдан", value: "served" },
  { label: "Отменен", value: "cancelled" },
];

export const statusColor: Record<OrderStatus, string> = {
  paid: "blue",
  prepared: "orange",
  served: "green",
  cancelled: "red",
};
