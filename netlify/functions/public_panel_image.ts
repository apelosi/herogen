import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";
 
type ComicRow = {
  panels: unknown;
};
 
type Panel = {
  id: number;
  imageUrl?: string;
};
 
const MAX_CACHE_SECONDS = 60 * 60 * 24 * 365; // 1 year
 
const decodeBase64DataUrl = (dataUrl: string): { mime: string; bytes: Buffer } => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL");
  }
  const mime = match[1];
  const base64 = match[2];
  return { mime, bytes: Buffer.from(base64, "base64") };
};
 
export const handler: Handler = async (event) => {
  try {
    const comicId = event.queryStringParameters?.comicId;
    const panelIdRaw = event.queryStringParameters?.panelId;
    const panelId = panelIdRaw ? Number(panelIdRaw) : NaN;
 
    if (!comicId || !panelIdRaw || !Number.isFinite(panelId)) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing or invalid query parameters: comicId, panelId" }),
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
      select panels
      from comics
      where id = ${comicId}
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
 
    const panels = rows[0]?.panels as Panel[] | undefined;
    const panel = Array.isArray(panels) ? panels.find((p) => Number(p?.id) === panelId) : undefined;
    const imageUrl = panel?.imageUrl;
    if (!imageUrl) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Panel image not found" }),
      };
    }
 
    // If we already have a URL (future-proof), redirect.
    if (!imageUrl.startsWith("data:")) {
      return {
        statusCode: 302,
        headers: {
          location: imageUrl,
          "cache-control": `public, max-age=${MAX_CACHE_SECONDS}, immutable`,
        },
        body: "",
      };
    }
 
    const { mime, bytes } = decodeBase64DataUrl(imageUrl);
    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "content-type": mime,
        "cache-control": `public, max-age=${MAX_CACHE_SECONDS}, immutable`,
        // Same-origin in production; CORS kept permissive for local netlify dev.
        "access-control-allow-origin": "*",
      },
      body: bytes.toString("base64"),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: e?.message ?? "Internal error" }),
    };
  }
};

