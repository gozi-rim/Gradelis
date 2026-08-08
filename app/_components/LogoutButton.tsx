import { logout } from "@/lib/actions/logout";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit">Sign out</button>
    </form>
  )
}
