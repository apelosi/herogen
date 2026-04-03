import { SavedComic, User } from "../types";
import { neonClient } from "./neonClient";

export const dbService = {
  async getPublicComic(id: string): Promise<SavedComic | undefined> {
    const url = `/.netlify/functions/public_comic?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: "GET" });
    if (res.status === 404) return undefined;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Failed to load public comic (${res.status})`);
    }
    const data = (await res.json()) as any;
    return {
      id: data.id,
      userId: data.userId,
      title: data.title,
      themeId: data.themeId,
      alignment: data.alignment as "HERO" | "VILLAIN",
      panels: data.panels as any,
      isPublic: data.isPublic,
      rating: data.rating,
      createdAt: data.createdAt,
    };
  },

  async saveUser(user: User): Promise<void> {
    // The authenticated user can only upsert their own row due to RLS.
    const session = await neonClient.auth.getSession();
    const authUserId = (session.data as any)?.session?.user?.id ?? (session.data as any)?.session?.userId;
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const payload = {
      // Keep `id` aligned with the Neon Auth user id (Option B).
      id: authUserId,
      auth_user_id: authUserId,
      name: user.name,
      email: user.email,
      photo_url: user.photoUrl,
      updated_at: new Date().toISOString(),
    };

    // Prefer update; if it doesn't exist, insert.
    const updateResult = await neonClient
      .from("users")
      .update(payload)
      .eq("auth_user_id", authUserId)
      .select();

    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }

    if (!updateResult.data || updateResult.data.length === 0) {
      const insertResult = await neonClient.from("users").insert(payload).select();
      if (insertResult.error) {
        throw new Error(insertResult.error.message);
      }
    }
  },

  async getUser(id: string): Promise<User | undefined> {
    const result = await neonClient.from("users").select("*").eq("id", id).limit(1);
    if (result.error) {
      throw new Error(result.error.message);
    }
    if (!result.data || result.data.length === 0) return undefined;

    const user = result.data[0] as any;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photo_url ?? null,
    };
  },

  async saveComic(comic: SavedComic): Promise<void> {
    const session = await neonClient.auth.getSession();
    const authUserId = (session.data as any)?.session?.user?.id ?? (session.data as any)?.session?.userId;
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const payload = {
      id: comic.id,
      user_id: comic.userId,
      owner_auth_user_id: authUserId,
      title: comic.title,
      theme_id: comic.themeId,
      alignment: comic.alignment,
      panels: comic.panels,
      is_public: comic.isPublic,
      rating: comic.rating,
      created_at: comic.createdAt,
      updated_at: new Date().toISOString(),
    };

    // Prefer update; if it doesn't exist, insert.
    const updateResult = await neonClient
      .from("comics")
      .update(payload)
      .eq("id", comic.id)
      .select();

    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }

    if (!updateResult.data || updateResult.data.length === 0) {
      const insertResult = await neonClient.from("comics").insert(payload).select();
      if (insertResult.error) {
        throw new Error(insertResult.error.message);
      }
    }
  },

  async getComicsByUser(userId: string): Promise<SavedComic[]> {
    const result = await neonClient.from("comics").select("*").eq("user_id", userId);
    if (result.error) {
      throw new Error(result.error.message);
    }

    return (result.data ?? []).map((comic: any) => ({
      id: comic.id,
      userId: comic.user_id,
      title: comic.title,
      themeId: comic.theme_id,
      alignment: comic.alignment as "HERO" | "VILLAIN",
      panels: comic.panels as any,
      isPublic: comic.is_public,
      rating: comic.rating,
      createdAt: comic.created_at,
    }));
  },

  async getComic(id: string): Promise<SavedComic | undefined> {
    const result = await neonClient.from("comics").select("*").eq("id", id).limit(1);
    if (result.error) {
      throw new Error(result.error.message);
    }
    if (!result.data || result.data.length === 0) return undefined;

    const comic = result.data[0] as any;
    return {
      id: comic.id,
      userId: comic.user_id,
      title: comic.title,
      themeId: comic.theme_id,
      alignment: comic.alignment as "HERO" | "VILLAIN",
      panels: comic.panels as any,
      isPublic: comic.is_public,
      rating: comic.rating,
      createdAt: comic.created_at,
    };
  },

  async deleteComic(id: string): Promise<void> {
    const result = await neonClient.from("comics").delete().eq("id", id);
    if (result.error) {
      throw new Error(result.error.message);
    }
  }
};