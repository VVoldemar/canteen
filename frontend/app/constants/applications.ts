import type { OrderStatus } from "~/types";

export const statusOptions: Array<{ label: string; value: OrderStatus }> = [
  { label: "Ожидает согласования", value: "paid" },
  { label: "Согласован", value: "served" },
  { label: "Отменен", value: "cancelled" },
];

export const statusColor: Record<OrderStatus, string> = {
  paid: "blue",
  served: "green",
  cancelled: "red",
};

export const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU");
};
