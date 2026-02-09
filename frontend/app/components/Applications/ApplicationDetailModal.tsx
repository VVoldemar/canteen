import { Button, Empty, Modal, Spin, Table, Tag, Typography } from "antd";
import type { ApplicationDetail } from "~/types";
import { UserLink } from "~/components/UserLink";
import { statusOptions, statusColor, formatDate } from "~/constants/applications";

const { Text } = Typography;

interface ApplicationDetailModalProps {
  open: boolean;
  loading: boolean;
  detail: ApplicationDetail | null;
  onClose: () => void;
}

export function ApplicationDetailModal({
  open,
  loading,
  detail,
  onClose,
}: ApplicationDetailModalProps) {
  return (
    <Modal
      open={open}
      title={`Заявка #${detail?.id ?? ""}`}
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
            <Text>
              Пользователь: <UserLink user={detail.applicant} />
            </Text>
            <Text>
              Статус:{" "}
              <Tag color={statusColor[detail.status]}>
                {statusOptions.find((item) => item.value === detail.status)?.label}
              </Tag>
            </Text>
            <Text>Дата: {formatDate(detail.datetime)}</Text>
            {detail.status === "cancelled" && detail.rejection_reason && (
              <Text>
                <Text>Причина отклонения:</Text> {detail.rejection_reason}
              </Text>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Text strong>Состав заявки</Text>
            <Table
              dataSource={detail.products}
              pagination={false}
              size="small"
              rowKey={(record) => `${record.ingredient.id}-${record.quantity}`}
              columns={[
                {
                  title: "Ингредиент",
                  dataIndex: ["ingredient", "name"],
                  key: "ingredient",
                },
                {
                  title: "Количество",
                  dataIndex: "quantity",
                  key: "quantity",
                  width: 120,
                },
                {
                  title: "Ед. изм.",
                  key: "measure",
                  width: 100,
                  render: (_, record) =>
                    record.ingredient.measure === "Kg" ? "кг" : "л",
                },
              ]}
              locale={{ emptyText: <Empty description="Нет ингредиентов" /> }}
            />
          </div>
        </div>
      ) : (
        <Text type="secondary">Заявка не найдена</Text>
      )}
    </Modal>
  );
}
