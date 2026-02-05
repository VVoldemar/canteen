import type { User } from "~/types";

export function getUserInitials(user?: User | null): string {
  if (!user) return "?";
  const first = user.name?.[0] || "";
  const last = user.surname?.[0] || "";
  return (first + last).toUpperCase();
}
