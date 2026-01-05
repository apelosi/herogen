import { SavedComic, User } from "../types";
import { db } from "../db";
import { users, comics } from "../db/schema";
import { eq } from "drizzle-orm";

export const dbService = {
  async saveUser(user: User): Promise<void> {
    await db.insert(users).values({
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl
      }
    });
  },

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (result.length === 0) return undefined;

    const user = result[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl
    };
  },

  async saveComic(comic: SavedComic): Promise<void> {
    await db.insert(comics).values({
      id: comic.id,
      userId: comic.userId,
      title: comic.title,
      themeId: comic.themeId,
      alignment: comic.alignment,
      panels: comic.panels,
      isPublic: comic.isPublic,
      rating: comic.rating,
      createdAt: comic.createdAt
    }).onConflictDoUpdate({
      target: comics.id,
      set: {
        title: comic.title,
        themeId: comic.themeId,
        alignment: comic.alignment,
        panels: comic.panels,
        isPublic: comic.isPublic,
        rating: comic.rating,
        createdAt: comic.createdAt
      }
    });
  },

  async getComicsByUser(userId: string): Promise<SavedComic[]> {
    const result = await db.select().from(comics).where(eq(comics.userId, userId));

    return result.map(comic => ({
      id: comic.id,
      userId: comic.userId,
      title: comic.title,
      themeId: comic.themeId,
      alignment: comic.alignment as 'HERO' | 'VILLAIN',
      panels: comic.panels as any,
      isPublic: comic.isPublic,
      rating: comic.rating,
      createdAt: comic.createdAt
    }));
  },

  async getComic(id: string): Promise<SavedComic | undefined> {
    const result = await db.select().from(comics).where(eq(comics.id, id)).limit(1);
    if (result.length === 0) return undefined;

    const comic = result[0];
    return {
      id: comic.id,
      userId: comic.userId,
      title: comic.title,
      themeId: comic.themeId,
      alignment: comic.alignment as 'HERO' | 'VILLAIN',
      panels: comic.panels as any,
      isPublic: comic.isPublic,
      rating: comic.rating,
      createdAt: comic.createdAt
    };
  },

  async deleteComic(id: string): Promise<void> {
    await db.delete(comics).where(eq(comics.id, id));
  }
};