import { Badge, Button, Empty, List, Popover, Spin, Tag, Typography } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import type { Notification } from "~/types";

const { Text } = Typography;

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU");
}

function NotificationContent({
  notifications,
  loading,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: Omit<NotificationBellProps, "open" | "onOpenChange">) {
  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spin />
      </div>
    );
  }

  return (
    <div className="w-80 max-h-96 flex flex-col">
      {unreadCount > 0 && (
        <div className="flex justify-end px-1 pb-2 border-b border-gray-100">
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={onMarkAllAsRead}
          >
            Прочитать все
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Empty
          description="Нет уведомлений"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="py-4"
        />
      ) : (
        <List
          className="overflow-y-auto max-h-80"
          dataSource={notifications}
          renderItem={(item: Notification) => (
            <List.Item
              className={`cursor-pointer px-2 hover:bg-gray-50 transition-colors ${
                !item.read ? "bg-blue-50/50" : ""
              }`}
              onClick={() => {
                if (!item.read) onMarkAsRead(item.id);
              }}
            >
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between gap-2">
                  <Text strong className="text-sm truncate flex-1">
                    {item.title}
                  </Text>
                  {!item.read && (
                    <Tag color="blue" className="!m-0 !text-xs">
                      Новое
                    </Tag>
                  )}
                </div>
                <Text className="text-sm !text-gray-600 line-clamp-2">
                  {item.body}
                </Text>
                <Text type="secondary" className="!text-xs">
                  {formatDate(item.created_at)}
                </Text>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}

export function NotificationBell(props: NotificationBellProps) {
  const { unreadCount, open, onOpenChange, ...contentProps } = props;

  return (
    <Popover
      content={
        <NotificationContent unreadCount={unreadCount} {...contentProps} />
      }
      title="Уведомления"
      trigger="click"
      open={open}
      onOpenChange={onOpenChange}
      placement="bottomRight"
      arrow={{ pointAtCenter: true }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined className="!text-lg" />}
          className="flex items-center justify-center"
        />
      </Badge>
    </Popover>
  );
}
