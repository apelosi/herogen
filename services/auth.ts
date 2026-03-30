import { User } from "../types";
import { neonClient } from "./neonClient";
import { dbService } from "./db";

/**
 * Authentication service backed by Neon Auth (Better Auth).
 */
export const authService = {
  async signInWithGoogle(callbackURL: string): Promise<void> {
    const result = await neonClient.auth.signIn.social({
      provider: "google",
      callbackURL,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  },

  async signOut(): Promise<void> {
    await neonClient.auth.signOut();
  },

  async getCurrentUser(): Promise<User | null> {
    const session = await neonClient.auth.getSession();
    if (session.error) {
      throw new Error(session.error.message);
    }

    if (!session.data?.session) return null;

    const authUserId = (session.data.session as any).userId as string | undefined;
    if (!authUserId) return null;

    // Ensure an application-level profile exists (RLS restricts to self).
    const existing = await neonClient
      .from("users")
      .select("*")
      .eq("auth_user_id", authUserId)
      .limit(1);

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (!existing.data || existing.data.length === 0) {
      await dbService.saveUser({
        id: authUserId,
        name: "User",
        email: "",
        photoUrl: null,
      });
    }

    // Return the row from our app table (includes photoUrl).
    const row = await neonClient
      .from("users")
      .select("*")
      .eq("auth_user_id", authUserId)
      .limit(1);
    if (row.error) {
      throw new Error(row.error.message);
    }
    if (!row.data || row.data.length === 0) return null;

    const user = row.data[0] as any;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photo_url ?? null,
    };
  }
};