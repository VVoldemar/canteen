import {
  HomeOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  BellOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import type { UserRole } from "~/types";

export interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  roles?: UserRole[]; // if not stated - available for all
}

export const menuItems: MenuItem[] = [
  // {
  //   key: "/",
  //   icon: <HomeOutlined />,
  //   label: "Главная",
  // },
  {
    key: "/menu",
    icon: <AppstoreOutlined />,
    label: "Меню",
  },
  {
    key: "/dishes",
    icon: <ShoppingOutlined />,
    label: "Блюда",
    roles: ["admin", "cook"],
  },
  {
    key: "/orders",
    icon: <ShoppingCartOutlined />,
    label: "Заказы",
  },
  {
    key: "/reviews",
    icon: <StarOutlined />,
    label: "Отзывы",
  },
  {
    key: "/subscriptions",
    icon: <CreditCardOutlined />,
    label: "Абонементы",
    roles: ["student"],
  },
  {
    key: "/applications",
    icon: <FileTextOutlined />,
    label: "Заявки",
    roles: ["admin", "cook"],
  },
  {
    key: "/ingredients",
    icon: <ExperimentOutlined />,
    label: "Ингредиенты",
    roles: ["admin", "cook"],
  },
  {
    key: "/users",
    icon: <TeamOutlined />,
    label: "Пользователи",
    roles: ["admin"],
  },
  {
    key: "/statistics",
    icon: <BarChartOutlined />,
    label: "Статистика",
    roles: ["admin"],
  },
  {
    key: "/reports",
    icon: <FileTextOutlined />,
    label: "Отчёты",
    roles: ["admin"],
  },
  {
    key: "/notifications",
    icon: <BellOutlined />,
    label: "Уведомления",
  },
];
