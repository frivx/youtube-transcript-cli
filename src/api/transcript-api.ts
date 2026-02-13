import { LRUCache } from "lru-cache";
import { getApiBaseUrl, getYtApiKey } from "../config/store.js";

export interface TranscriptItem {
  id: string;
  video_id: string;
  video_title: string;
  language: string;
  source_kind: string;
  status: string;
  created_at: string;
  segments?: Array<{ text: string; start: number; end: number }>;
  credits_used?: number;
}

export interface HistoryResponse {
  items: TranscriptItem[];
  total: number;
}

export interface CreditsResponse {
  credits: number;
  total_credits: number;
  subscription_credits: number;
  extra_credits: number;
  plan: string;
}

export interface TranscribeResponse {
  status: "completed" | "processing";
  video_id?: string;
  text?: string;
  credits_used?: number;
  error?: string;
}

const responseCache = new LRUCache<string, any>({
  max: 256,
  ttl: 300_000,
});

const CREDITS_PATH = "/api/v1/credits";
let lastCreditsSnapshot: CreditsResponse | null = null;

function cacheKey(path: string, method: string): string {
  return `${method.toUpperCase()}:${path}`;
}

function canUseCache(options: RequestInit): boolean {
  const method = (options.method || "GET").toUpperCase();
  return method === "GET" && !options.body;
}

function buildHistoryPath(params?: {
  limit?: number;
  search?: string;
  status?: string;
  includeSegments?: boolean;
}): string {
  const sp = new URLSearchParams();
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.search) sp.set("search", params.search);
  if (params?.status) sp.set("status", params.status);
  if (params?.includeSegments) sp.set("include_segments", "true");
  const q = sp.toString();
  return `/api/v1/history${q ? `?${q}` : ""}`;
}

function buildTranscriptPath(videoId: string, options?: { language?: string; id?: string }): string {
  const sp = new URLSearchParams();
  if (options?.language) sp.set("language", options.language);
  if (options?.id) sp.set("id", options.id);
  const q = sp.toString();
  return `/api/v1/transcripts/${videoId}${q ? `?${q}` : ""}`;
}

async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
  cacheTtlMs?: number
): Promise<T> {
  const key = getYtApiKey();
  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const useCache = canUseCache(options);
  const keyName = cacheKey(path, method);

  if (useCache) {
    const cached = responseCache.get(keyName) as T | undefined;
    if (cached !== undefined) {
      return cached;
    }
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    let msg = body;
    try {
      const j = JSON.parse(body);
      msg = j.error || j.message || body;
    } catch {}
    throw new Error(`API ${res.status}: ${msg}`);
  }

  const payload = (await res.json()) as T;
  if (useCache) {
    responseCache.set(keyName, payload, { ttl: cacheTtlMs ?? 60_000 });
  }

  return payload;
}

export function clearApiCache(): void {
  responseCache.clear();
}

export function getCachedCredits(): CreditsResponse | null {
  const cached = (responseCache.get(cacheKey(CREDITS_PATH, "GET")) as CreditsResponse | undefined) || null;
  return cached || lastCreditsSnapshot;
}

export function getCachedHistory(params?: {
  limit?: number;
  search?: string;
  status?: string;
  includeSegments?: boolean;
}): HistoryResponse | null {
  const path = buildHistoryPath(params);
  const cached = responseCache.get(cacheKey(path, "GET")) as
    | {
        history?: TranscriptItem[];
        items?: TranscriptItem[];
        count?: number;
        pagination?: { total?: number };
      }
    | undefined;

  if (!cached) return null;

  const items = cached.history ?? cached.items ?? [];
  const total = cached.pagination?.total ?? cached.count ?? items.length;
  return { items, total };
}

export function getCachedTranscript(
  videoId: string,
  options?: { language?: string; id?: string }
): {
  id: string;
  video_id: string;
  text: string;
  segments: Array<{ text: string; start: number; end: number }>;
  language: string;
  video_title?: string;
} | null {
  const path = buildTranscriptPath(videoId, options);
  return (
    (responseCache.get(cacheKey(path, "GET")) as
      | {
          id: string;
          video_id: string;
          text: string;
          segments: Array<{ text: string; start: number; end: number }>;
          language: string;
          video_title?: string;
        }
      | undefined) || null
  );
}

export async function getCredits(): Promise<CreditsResponse> {
  const credits = await fetchApi<CreditsResponse>(CREDITS_PATH, {}, 600_000);
  lastCreditsSnapshot = credits;
  return credits;
}

export async function listHistory(params?: {
  limit?: number;
  search?: string;
  status?: string;
  includeSegments?: boolean;
}): Promise<HistoryResponse> {
  const path = buildHistoryPath(params);
  const data = await fetchApi<{
    history?: TranscriptItem[];
    count?: number;
    pagination?: { total?: number };
  }>(path, {}, 120_000);

  const items = data.history ?? (data as { items?: TranscriptItem[] }).items ?? [];
  const total = data.pagination?.total ?? data.count ?? items.length;
  return { items, total };
}

export async function getTranscript(
  videoId: string,
  options?: { language?: string; id?: string }
): Promise<{
  id: string;
  video_id: string;
  text: string;
  segments: Array<{ text: string; start: number; end: number }>;
  language: string;
  video_title?: string;
}> {
  const path = buildTranscriptPath(videoId, options);
  return fetchApi(path, {}, 1_800_000);
}

export async function transcribeSingle(params: {
  video_url: string;
  language?: string;
}): Promise<TranscribeResponse> {
  const body = { video: params.video_url, language: params.language };
  const res = await fetchApi<{
    status: string;
    data?: { video_id?: string; transcript?: { text?: string } };
    credits_used?: number;
    error?: string;
  }>("/api/v2/transcribe", {
    method: "POST",
    body: JSON.stringify(body),
  });

  clearApiCache();

  return {
    status: res.status as "completed" | "processing",
    video_id: res.data?.video_id,
    text: res.data?.transcript?.text,
    credits_used: res.credits_used,
    error: res.error,
  };
}

export async function transcribeBatch(params: {
  video_ids: string[];
  language?: string;
}): Promise<{ batch_id: string; status: string }> {
  const result = await fetchApi<{ batch_id: string; status: string }>("/api/v2/batch", {
    method: "POST",
    body: JSON.stringify(params),
  });

  clearApiCache();

  return result;
}

export async function getBatchStatus(batchId: string): Promise<{
  batch_id: string;
  status: string;
  results?: Array<{ video_id: string; status: string; id?: string }>;
}> {
  return fetchApi(`/api/v2/batch/${batchId}`, {}, 10_000);
}

export function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  return null;
}
