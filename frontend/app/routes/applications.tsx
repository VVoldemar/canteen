import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Form, Select, Space, Table, Typography } from "antd";
import type { Route } from "./+types/applications";
import { useAuth } from "~/context/AuthContext";
import { statusOptions } from "~/constants/applications";
import { useApplications, useApplicationDetail, useApplicationActions } from "~/hooks/useApplications";
import { useIngredients } from "~/hooks/useIngredients";
import { getApplicationColumns } from "~/components/Applications/ApplicationsTable";
import { CreateApplicationModal } from "~/components/Applications/CreateApplicationModal";
import { ApplicationDetailModal } from "~/components/Applications/ApplicationDetailModal";
import { RejectApplicationModal } from "~/components/Applications/RejectApplicationModal";
import type { CreateApplicationRequest, OrderStatus } from "~/types";

const { Title, Text } = Typography;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Заявки — Школьная столовая" }];
}

export default function ApplicationsPage() {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [currentRejectId, setCurrentRejectId] = useState<number | null>(null);

  const [createForm] = Form.useForm<CreateApplicationRequest>();
  const [rejectForm] = Form.useForm<{ reason: string }>();

  const canManage = user?.role === "admin" || user?.role === "cook";
  const canApprove = user?.role === "admin";

  const { items, loading, total, loadApplications } = useApplications(page, pageSize, statusFilter);
  const { detail, loading: detailLoading, loadDetail } = useApplicationDetail();
  const { saving, create, approve, reject } = useApplicationActions();
  const { ingredients, loading: ingredientsLoading, loadIngredients } = useIngredients();

  useEffect(() => {
    if (canManage) {
      loadApplications();
    }
  }, [canManage, loadApplications]);

  const handleOpenCreateModal = async () => {
    createForm.resetFields();
    createForm.setFieldValue("products", [
      { ingredient_id: undefined, quantity: undefined },
    ]);
    setCreateModalOpen(true);
    await loadIngredients();
  };

  const handleOpenDetailModal = async (id: number) => {
    setDetailModalOpen(true);
    await loadDetail(id);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const success = await create(values);
      if (success) {
        setCreateModalOpen(false);
        createForm.resetFields();
        await loadApplications();
      }
    } catch (error) {
      // Validation error, do nothing
    }
  };

  const handleApprove = async (id: number) => {
    const success = await approve(id);
    if (success) {
      await loadApplications();
    }
  };

  const handleOpenRejectModal = (id: number) => {
    setCurrentRejectId(id);
    rejectForm.resetFields();
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      if (!currentRejectId) return;
      const success = await reject(currentRejectId, values.reason);
      if (success) {
        setRejectModalOpen(false);
        setCurrentRejectId(null);
        await loadApplications();
      }
    } catch (error) {
      // Validation error, do nothing
    }
  };

  const columns = useMemo(
    () =>
      getApplicationColumns({
        canApprove,
        onViewDetail: (record) => handleOpenDetailModal(record.id),
        onApprove: handleApprove,
        onReject: handleOpenRejectModal,
      }),
    [canApprove],
  );

  if (!canManage) {
    return (
      <div>
        <Title level={2}>Заявки</Title>
        <Empty description="Доступ только для администраторов и поваров" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} className="!mb-0">
            Заявки на закупку
          </Title>
          <Text type="secondary">Список заявок и их статус</Text>
        </div>
        <Space>
          <Select
            allowClear
            placeholder="Статус"
            options={statusOptions}
            onChange={(value) => {
              setPage(1);
              setStatusFilter(value);
            }}
            style={{ width: 160 }}
          />
          <Button onClick={loadApplications}>Обновить</Button>
          <Button type="primary" onClick={handleOpenCreateModal}>
            Создать заявку
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            if (nextPageSize && nextPageSize !== pageSize) {
              setPageSize(nextPageSize);
            }
          },
          showSizeChanger: true,
        }}
      />

      <CreateApplicationModal
        open={createModalOpen}
        saving={saving}
        ingredients={ingredients}
        ingredientsLoading={ingredientsLoading}
        form={createForm}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
      />

      <ApplicationDetailModal
        open={detailModalOpen}
        loading={detailLoading}
        detail={detail}
        onClose={() => setDetailModalOpen(false)}
      />

      <RejectApplicationModal
        open={rejectModalOpen}
        saving={saving}
        form={rejectForm}
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleReject}
      />
    </div>
  );
}
