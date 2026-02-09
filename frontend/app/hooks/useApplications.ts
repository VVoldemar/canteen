import { useCallback, useState } from "react";
import { App } from "antd";
import type {
  Application,
  ApplicationDetail,
  CreateApplicationRequest,
  OrderStatus,
} from "~/types";
import {
  approveApplication,
  createApplication,
  getApplication,
  getApplications,
  rejectApplication,
} from "~/api/applications";
import { ApiException } from "~/api/errors";

export function useApplications(page: number, pageSize: number, statusFilter?: OrderStatus) {
  const { message } = App.useApp();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getApplications({
        page,
        limit: pageSize,
        status: statusFilter,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при загрузке заявок");
      }
    } finally {
      setLoading(false);
    }
  }, [message, page, pageSize, statusFilter]);

  return { items, loading, total, loadApplications };
}

export function useApplicationDetail() {
  const { message } = App.useApp();
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDetail = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const data = await getApplication(id);
      setDetail(data);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось загрузить заявку");
      }
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [message]);

  return { detail, loading, loadDetail };
}

export function useApplicationActions() {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  const create = useCallback(async (data: CreateApplicationRequest) => {
    setSaving(true);
    try {
      await createApplication(data);
      message.success("Заявка создана");
      return true;
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else if (error instanceof Error && error.message) {
        message.error(error.message);
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [message]);

  const approve = useCallback(async (id: number) => {
    setSaving(true);
    try {
      await approveApplication(id);
      message.success("Заявка согласована");
      return true;
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Не удалось согласовать заявку");
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [message]);

  const reject = useCallback(async (id: number, reason?: string) => {
    setSaving(true);
    try {
      await rejectApplication(id, { reason });
      message.success("Заявка отклонена");
      return true;
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else if (error instanceof Error && error.message) {
        message.error(error.message);
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, [message]);

  return { saving, create, approve, reject };
}
