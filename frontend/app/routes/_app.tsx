import { AppLayout } from "~/components/AppLayout";
import { RequireAuth } from "~/components/RequireAuth";

export default function AppLayoutRoute() {
  return (
    <RequireAuth>
      <AppLayout />
    </RequireAuth>
  );
}
