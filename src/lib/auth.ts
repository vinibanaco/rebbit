import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";
import bcrypt from "bcryptjs";
import type { User } from "./types";

// Get the current user from the cookie
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const [user] = (await sql`
      SELECT id, username, email
      FROM users
      WHERE id = ${Number.parseInt(token, 10)}
    `) as User[];

    return user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Login function
export async function login(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const [user] = (await sql`
      SELECT id, username, email, password_hash
      FROM users
      WHERE email = ${email}
    `) as (User & { password_hash: string })[];

    if (!user) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return null;
    }

    // Set cookie
    (await cookies()).set("auth_token", user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  } catch (error) {
    console.error("Error logging in:", error);
    return null;
  }
}

// Register function
export async function register(
  username: string,
  email: string,
  password: string
): Promise<User | null> {
  try {
    // Check if user already exists
    const existingUsers = (await sql`
      SELECT COUNT(*) as count
      FROM users
      WHERE username = ${username} OR email = ${email}
    `) as { count: number }[];

    if (existingUsers[0].count > 0) {
      return null;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = (await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES (${username}, ${email}, ${passwordHash})
      RETURNING id, username, email
    `) as User[];

    // Set cookie
    (await cookies()).set("auth_token", newUser.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return newUser;
  } catch (error) {
    console.error("Error registering user:", error);
    return null;
  }
}

// Logout function
export async function logout() {
  (await cookies()).delete("auth_token");
}

// Auth required middleware
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
