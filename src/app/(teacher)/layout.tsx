import AuthGuard from "@/components/auth/AuthGuard";
import DashboardShell from "@/components/layout/DashboardShell";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard mode="teacher">
      <DashboardShell mode="teacher">{children}</DashboardShell>
    </AuthGuard>
  );
}
