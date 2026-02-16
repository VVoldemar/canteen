import { useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Typography } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useMenu } from "~/hooks/useMenu";
import { getUserInitials } from "~/utils/user";
import { getProfileMenuItems } from "~/utils/profileMenu";
import type { MenuProps } from "antd";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = useMenu(user?.role);

  const profileMenuItems = getProfileMenuItems({
    onProfileClick: () => navigate("/profile"),
    onLogout: async () => {
      await logout();
      navigate("/login");
    },
  });

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth={80}
        width={240}
        onCollapse={(value) => setCollapsed(value)}
        className="sticky! top-0 overflow-auto h-screen"
      >
        <div className="p-4 text-white">
          <Title
            level={4}
            className="!text-white !mb-0 whitespace-nowrap overflow-hidden"
          >
            {collapsed ? "🍽️" : "Canteen"}
          </Title>
          {!collapsed && (
            <Text className="!text-white/70">Панель управления</Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={onMenuClick}
        />
      </Sider>

      <Layout>
        <Header className="!bg-white px-4 flex items-center justify-between border-b border-gray-200">
          {/* <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          /> */}

          <Dropdown menu={{ items: profileMenuItems }}>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-lg">
              <Avatar className="bg-blue-500">{getUserInitials(user)}</Avatar>
              <Text className="hidden sm:inline">
                {user?.name} {user?.surname}
              </Text>
            </div>
          </Dropdown>
        </Header>

        <Content className="m-4 p-6 bg-white rounded-lg !flex-none">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
