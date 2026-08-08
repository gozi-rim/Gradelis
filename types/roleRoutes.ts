const adminRoute = "/admin"
const adviserRoute = "/adviser"
const hodRoute = "/hod"

export const routeAccess: Record<string, string[]> = {
  "/admin": ["SYSTEM_ADMIN"],
  "/hod": ["HOD"],
  "/adviser": ["LECTURER"],
}
export const roleRoutes: Record<string, string> = {
  SYSTEM_ADMIN: adminRoute,
  HOD: hodRoute,
  LECTURER: adviserRoute,
}
