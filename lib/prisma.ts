import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

// Without this, pg quietly falls back to your OS username and you get
// 'database "<you>" does not exist', which sends you hunting the wrong thing.
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env, or run the script with --env-file=.env.",
  );
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
