import { Card } from "antd";
import type { User } from "~/types";
import { UserInfo } from "~/components/UserInfo";

interface ProfileInfoCardProps {
  user: User;
}

export function ProfileInfoCard({ user }: ProfileInfoCardProps) {
  return (
    <Card>
      <UserInfo user={user} size="default" />
    </Card>
  );
}
