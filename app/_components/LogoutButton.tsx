import { logout } from "@/lib/actions/logout";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="group flex items-center gap-2 rounded-xl border border-red-400 px-4 py-3 text-sm font-medium text-red-400  transition-all hover:border-transparent hover:bg-red-400 hover:text-white hover:cursor-pointer"
      >
        <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        <span>Sign out</span>
      </button>
    </form>
  );
}
