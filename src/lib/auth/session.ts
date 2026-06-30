import "server-only";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { Position } from "@/lib/positions/types";

export interface SessionUser {
  email: string;
  name: string;
}

export interface SessionData {
  user?: SessionUser;
  watchlist?: string[];
  positions?: Position[];
  portfolioSeedVersion?: number;
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "1";

function getSessionOptions() {
  const password =
    process.env.SESSION_SECRET ?? "mdc-capital-holdings-dev-session-secret";

  return {
    password,
    cookieName: "mdc_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7,
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), getSessionOptions());
}

async function verifyPassword(password: string): Promise<boolean> {
  const plain = process.env.ADMIN_PASSWORD ?? "1";
  return password === plain;
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<SessionUser | null> {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
  if (!(await verifyPassword(password))) return null;
  return { email: ADMIN_EMAIL, name: "Admin" };
}

export async function loginUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  return loginAdmin(email, password);
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session.user) throw new Error("Unauthorized");
  return session.user;
}
