import { useMemo } from "react";
import type { MenuProps } from "antd";
import type { UserRole } from "~/types";
import { menuItems, type MenuItem } from "~/constants/menuItems";

export function useMenu(userRole?: UserRole): MenuProps["items"] {
  return useMemo(() => {
    return menuItems
      .filter((item) => {
        if (!item.roles) return true;
        return userRole && item.roles.includes(userRole);
      })
      .map(({ key, icon, label }) => ({ key, icon, label }));
  }, [userRole]);
}
