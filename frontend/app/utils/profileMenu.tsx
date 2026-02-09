import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";

interface ProfileMenuOptions {
  onProfileClick: () => void;
  onLogout: () => void;
}

export function getProfileMenuItems({
  onProfileClick,
  onLogout,
}: ProfileMenuOptions): MenuProps["items"] {
  return [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Профиль",
      onClick: onProfileClick,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Выйти",
      danger: true,
      onClick: onLogout,
    },
  ];
}
