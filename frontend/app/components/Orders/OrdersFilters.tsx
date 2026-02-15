import { Button, DatePicker, InputNumber, Select, Space } from "antd";
import type { Dayjs } from "dayjs";
import type { OrderStatus } from "~/types";
import { statusOptions } from "~/constants/orders";

const { RangePicker } = DatePicker;

interface OrdersFiltersProps {
  statusFilter?: OrderStatus;
  userIdFilter?: number;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  onStatusChange: (value?: OrderStatus) => void;
  onUserIdChange: (value?: number) => void;
  onDateRangeChange: (value: [Dayjs | null, Dayjs | null] | null) => void;
  onRefresh: () => void;
  onCreateOrder?: () => void;
  canCreate: boolean;
  showUserFilter: boolean;
}

export function OrdersFilters({
  statusFilter,
  userIdFilter,
  dateRange,
  onStatusChange,
  onUserIdChange,
  onDateRangeChange,
  onRefresh,
  onCreateOrder,
  canCreate,
  showUserFilter,
}: OrdersFiltersProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap w-full">
      <Space>
        <Select
          allowClear
          placeholder="Статус"
          value={statusFilter}
          options={statusOptions}
          onChange={onStatusChange}
          style={{ width: 160 }}
        />
        {showUserFilter && (
          <InputNumber
            placeholder="ID пользователя"
            value={userIdFilter}
            min={1}
            onChange={(value) => onUserIdChange(value ?? undefined)}
          />
        )}
        <RangePicker value={dateRange} onChange={onDateRangeChange} />
      </Space>
      <Space>
        <Button onClick={onRefresh}>Обновить</Button>
        {canCreate && onCreateOrder && (
          <Button type="primary" onClick={onCreateOrder}>
            Создать заказ
          </Button>
        )}
      </Space>
    </div>
  );
}
