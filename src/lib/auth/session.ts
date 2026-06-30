import "server-only";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export interface SessionUser {
  email: string;
  name: string;
}

export interface SessionData {
  user?: SessionUser;
  watchlist?: string[];
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@mdccapitalholdings.com";

const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ??
  "$2b$10$u0DN49dIL.xM4OfVlNIpduTF9jTPmb8IzR2uX.6.cRk1BuOkOcuJ.";

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
  const plain = process.env.ADMIN_PASSWORD;
  if (plain) return password === plain;
  return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
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
