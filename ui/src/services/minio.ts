// src/services/minio.ts
const BASE = "http://localhost:9000";
const BUCKET = "codex";

/** If you pass a full URL, it's returned untouched. If you pass an object key, it builds the MinIO URL. */
export function toMinioUrl(input: string) {
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  const key = input.replace(/^\/+/, "");
  return `${BASE}/${BUCKET}/${key}`;
}

/** Build a page URL: ch_#/pg_#.jpg */
export function pageUrlFromSlug(slug: string, ch: number, pg: number, ext = "jpg") {
  return `${BASE}/${BUCKET}/${slug}/ch_${ch}/pg_${pg}.${ext}`;
}

/** Build cover URL from a slug like "no-more-princes" */
export function coverUrlFromSlug(slug: string) {
  return `${BASE}/${BUCKET}/${slug}/cover.jpg`;
}
