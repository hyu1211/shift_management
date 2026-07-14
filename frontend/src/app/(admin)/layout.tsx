import AuthGuard from "@/components/auth/AuthGuard";
import DashboardShell from "@/components/layout/DashboardShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard mode="admin">
      <DashboardShell mode="admin">{children}</DashboardShell>
    </AuthGuard>
  );
}
