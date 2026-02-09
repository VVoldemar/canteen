import { useState } from "react";
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Select,
  Space,
  Typography,
  Divider,
} from "antd";
import { DownloadOutlined, FileTextOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import type { Route } from "./+types/reports";
import { ApiException } from "~/api/errors";
import { generateReport, downloadReport } from "~/api/reports";
import { useAuth } from "~/context/AuthContext";
import type { ReportType } from "~/types";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Отчёты — Школьная столовая" }];
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [reportType, setReportType] = useState<ReportType>("nutrirtion");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{
    id: number;
    report_type: string;
    generated_at: string;
    download_url: string;
  } | null>(null);

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const report = await generateReport({
        report_type: reportType,
        date_from: dateRange?.[0]?.format("YYYY-MM-DD"),
        date_to: dateRange?.[1]?.format("YYYY-MM-DD"),
      });
      setGeneratedReport(report);
      message.success("Отчёт успешно сгенерирован");
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при генерации отчёта");
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!generatedReport) return;

    try {
      const blob = await downloadReport(generatedReport.download_url);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report_${generatedReport.report_type}_${new Date(generatedReport.generated_at).toLocaleDateString()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success("Отчёт скачан");
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else {
        message.error("Ошибка при скачивании отчёта");
      }
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div>
        <Title level={2}>Отчёты</Title>
        <Empty description="Доступ только для администраторов" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Title level={2} className="!mb-0">
          Отчёты
        </Title>
        <Text type="secondary">Генерация и скачивание PDF-отчётов</Text>
      </div>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            Генерация PDF-отчётов
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Text>
              Выберите тип отчёта и период для генерации PDF-документа
            </Text>
          </div>
          <Space size="middle" wrap>
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: 200 }}
              options={[
                { label: "Отчёт по питанию", value: "nutrirtion" },
                { label: "Отчёт по посещаемости", value: "attendance" },
                { label: "Отчёт по платежам", value: "payments" },
                { label: "Полный отчёт", value: "full" },
              ]}
            />
            <RangePicker
              value={dateRange}
              onChange={(value) => setDateRange(value)}
              placeholder={["Дата начала", "Дата окончания"]}
            />
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={handleGenerateReport}
              loading={generatingReport}
            >
              Сгенерировать отчёт
            </Button>
          </Space>

          {generatedReport && (
            <>
              <Divider />
              <Space direction="vertical">
                <Text strong>Сгенерированный отчёт:</Text>
                <Space>
                  <Text>Тип: {generatedReport.report_type}</Text>
                  <Text type="secondary">|</Text>
                  <Text>
                    Создан:{" "}
                    {new Date(generatedReport.generated_at).toLocaleString(
                      "ru-RU",
                    )}
                  </Text>
                </Space>
                <Button
                  type="default"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadReport}
                >
                  Скачать PDF
                </Button>
              </Space>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}

