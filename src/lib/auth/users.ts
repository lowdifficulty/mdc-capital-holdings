import "server-only";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

interface UsersData {
  users: StoredUser[];
}

const FILE_PATH = path.join(process.cwd(), "data", "users.json");

async function readUsers(): Promise<UsersData> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as UsersData;
    return { users: parsed.users ?? [] };
  } catch {
    return { users: [] };
  }
}

async function writeUsers(data: UsersData): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const data = await readUsers();
  const normalized = email.trim().toLowerCase();
  return data.users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<{ user: StoredUser } | { error: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (!name || name.length < 2) {
    return { error: "Enter your name (at least 2 characters)." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const data = await readUsers();
  if (data.users.some((u) => u.email.toLowerCase() === email)) {
    return { error: "An account with this email already exists." };
  }

  const user: StoredUser = {
    id: randomUUID(),
    email,
    name,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };

  data.users.push(user);
  await writeUsers(data);
  return { user };
}

export async function verifyUserPassword(
  email: string,
  password: string
): Promise<StoredUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}
