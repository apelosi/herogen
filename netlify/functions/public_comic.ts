import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";
 
type ComicRow = {
  id: string;
  user_id: string;
  title: string;
  theme_id: string;
  alignment: "HERO" | "VILLAIN";
  panels: unknown;
  is_public: boolean;
  rating: number;
  created_at: number;
};
 
export const handler: Handler = async (event) => {
  try {
    const id = event.queryStringParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing required query parameter: id" }),
      };
    }
 
    const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
    if (!databaseUrl) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Server misconfigured: missing database URL" }),
      };
    }
 
    const sql = neon(databaseUrl);
    const rows = (await sql<ComicRow[]>`
      select
        id,
        user_id,
        title,
        theme_id,
        alignment,
        panels,
        is_public,
        rating,
        created_at
      from comics
      where id = ${id}
        and is_public = true
      limit 1
    `) as unknown as ComicRow[];
 
    if (!rows || rows.length === 0) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Not found" }),
      };
    }
 
    const comic = rows[0];
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        // Same-origin in production; CORS kept permissive for local netlify dev.
        "access-control-allow-origin": "*",
      },
      body: JSON.stringify({
        id: comic.id,
        userId: comic.user_id,
        title: comic.title,
        themeId: comic.theme_id,
        alignment: comic.alignment,
        panels: comic.panels,
        isPublic: comic.is_public,
        rating: comic.rating,
        createdAt: comic.created_at,
      }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: e?.message ?? "Internal error" }),
    };
  }
};

