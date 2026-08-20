import { AdminUploadWindowsScreen } from "@/features/administrator/screens/admin-upload-windows-screen";

export const metadata = {
  title: "Academic Sessions & Windows | Gradelis Administration",
  description: "Manage result submission windows, deadlines, and session authorizations",
};

export default function AdminAcademicSessionsPage() {
  return <AdminUploadWindowsScreen />;
}
