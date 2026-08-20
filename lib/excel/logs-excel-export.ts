import * as XLSX from "xlsx";

export type AuditLogExportItem = {
  id: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  category: string;
  target: string;
  details: string;
  timestamp: string;
  status: string;
};

export function exportLogsToExcel(logs: AuditLogExportItem[]) {
  const data = logs.map((log, idx) => ({
    "S/N": idx + 1,
    Timestamp: log.timestamp,
    User: `${log.userName} (${log.userEmail})`,
    Role: log.userRole,
    Action: log.action,
    Category: log.category,
    "Target / Entity": log.target,
    Details: log.details,
    Status: log.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 32 },
    { wch: 15 },
    { wch: 24 },
    { wch: 18 },
    { wch: 28 },
    { wch: 40 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "System_Audit_Logs");

  XLSX.writeFile(
    workbook,
    `gradelis_audit_logs_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}
