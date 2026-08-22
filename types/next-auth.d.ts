import type { UserRole } from "@/generated/prisma";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
  interface User {
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
