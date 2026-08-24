import { AdviserStudentDetailScreen } from "@/features/adviser/screens/adviser-student-detail-screen";

type PageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function StudentRecordDetailsPage({ params }: PageProps) {
  const { studentId } = await params;
  return <AdviserStudentDetailScreen studentId={studentId} />;
}
