import "server-only";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";

export type Actor = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type GuardResult =
  | { ok: true; actor: Actor }
  | { ok: false; message: string };

export async function currentActor(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

/** Server actions are open POST endpoints. The proxy only guards navigation. */
export async function requireRole(...allowed: UserRole[]): Promise<GuardResult> {
  const actor = await currentActor();

  if (!actor) {
    return { ok: false, message: "You are not signed in." };
  }

  if (!allowed.includes(actor.role)) {
    return { ok: false, message: "You are not permitted to perform this action." };
  }

  return { ok: true, actor };
}
