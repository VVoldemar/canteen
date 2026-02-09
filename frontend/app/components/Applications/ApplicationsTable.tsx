import { Button, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Application, OrderStatus } from "~/types";
import { UserLink } from "~/components/UserLink";
import { statusOptions, statusColor, formatDate } from "~/constants/applications";

interface GetColumnsParams {
  canApprove: boolean;
  onViewDetail: (record: Application) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export function getApplicationColumns({
  canApprove,
  onViewDetail,
  onApprove,
  onReject,
}: GetColumnsParams): ColumnsType<Application> {
  return [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
    },
    {
      title: "Пользователь",
      dataIndex: "applicant",
      render: (applicant: Application["applicant"]) => (
        <UserLink user={applicant} />
      ),
      width: 200,
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
      title: "Дата",
      dataIndex: "datetime",
      render: (value) => formatDate(value),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => onViewDetail(record)}>
            Подробнее
          </Button>
          {canApprove && record.status === "paid" && (
            <>
              <Button type="link" onClick={() => onApprove(record.id)}>
                Согласовать
              </Button>
              <Button type="link" danger onClick={() => onReject(record.id)}>
                Отклонить
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];
}
