import { useState } from "react";
import { Modal, Spin, Typography, App } from "antd";
import type { UserShort, User } from "~/types";
import { getUser } from "~/api/users";
import { ApiException } from "~/api/errors";
import { UserInfo } from "~/components/UserInfo";

const { Link, Text } = Typography;

interface UserLinkProps {
  user: UserShort;
}

export function UserLink({ user }: UserLinkProps) {
  const { message } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userDetail, setUserDetail] = useState<User | null>(null);

  const fullName = [user.surname, user.name, user.patronymic]
    .filter(Boolean)
    .join(" ");

  const handleClick = async () => {
    setModalOpen(true);
    setLoading(true);
    try {
      const data = await getUser(user.id);
      setUserDetail(data);
    } catch (error) {
      if (error instanceof ApiException) {
        message.error(error.error.message);
      } else if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Link onClick={handleClick}>{fullName}</Link>
      <Modal
        open={modalOpen}
        title="Информация о пользователе"
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <Spin />
          </div>
        ) : userDetail ? (
          <UserInfo user={userDetail} size="small" showAllergies={true} />
        ) : (
          <Text type="secondary">Не удалось загрузить информацию</Text>
        )}
      </Modal>
    </>
  );
}
