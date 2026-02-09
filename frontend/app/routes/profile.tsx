import { useState } from "react";
import { Typography, Button, Space } from "antd";
import { EditOutlined, DollarOutlined } from "@ant-design/icons";
import { useAuth } from "~/context/AuthContext";
import { ProfileInfoCard } from "~/components/Profile/ProfileInfoCard";
import { AllergiesSection } from "~/components/Profile/AllergiesSection";
import { EditProfileModal } from "~/components/Profile/EditProfileModal";
import { TopUpBalanceModal } from "~/components/Profile/TopUpBalanceModal";

const { Title } = Typography;

export function meta() {
  return [{ title: "Профиль — Школьная столовая" }];
}

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between mb--6">
        <Title level={2} className="!mb-0">
          Мой профиль
        </Title>
        <Space>
          <Button
            icon={<DollarOutlined />}
            onClick={() => setTopUpModalOpen(true)}
          >
            Пополнить баланс
          </Button>
          <Button icon={<EditOutlined />} onClick={() => setEditModalOpen(true)}>
            Редактировать
          </Button>
        </Space>
      </div>

      <ProfileInfoCard user={user} />

      <AllergiesSection user={user} onUpdate={refetchUser} />

      <EditProfileModal
        open={editModalOpen}
        user={user}
        onClose={() => setEditModalOpen(false)}
        onUpdate={refetchUser}
      />

      <TopUpBalanceModal
        open={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        onSuccess={refetchUser}
      />
    </div>
  );
}
