import { AdminUploadWindowsScreen } from "@/features/administrator/screens/admin-upload-windows-screen";

export const metadata = {
  title: "Submission Windows | Gradelis Administration",
  description: "Manage result submission windows, deadlines, and session authorizations",
};

export default function AdminSubmissionWindowsPage() {
  return <AdminUploadWindowsScreen />;
}
