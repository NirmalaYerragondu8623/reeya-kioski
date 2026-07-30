const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface PresignResponse {
  upload_url: string;
  object_key: string;
  public_url: string;
}

export interface ProductMatch {
  id: string;
  name: string;
  image_s3_url: string;
  similarity: number;
}

// Common shape for anything that can go in the cart/wishlist — both
// ProductMatch (image search) and VoiceMatch (voice/text search) satisfy
// this structurally, so either can be passed where a WishlistItem is expected.
export interface WishlistItem {
  id: string;
  name: string;
  image_s3_url: string;
  price?: number | null;
}

export interface ImageSearchResponse {
  uploaded_image_id: string;
  matches: ProductMatch[];
}

export function getOrCreateUserId(): string {
  const key = "reeya_kiosk_user_id";
  let userId = localStorage.getItem(key);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(key, userId);
  }
  return userId;
}

async function presignUpload(
  userId: string,
  file: File,
): Promise<PresignResponse> {
  const res = await fetch(`${API_BASE}/uploads/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      filename: file.name,
      content_type: file.type || null,
    }),
  });
  if (!res.ok) {
    throw new Error(`Presign failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Upload to storage failed: ${res.status}`);
  }
}

async function searchByImage(
  userId: string,
  s3Url: string,
  category?: string,
): Promise<ImageSearchResponse> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const res = await fetch(`${API_BASE}/image-search${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ s3_url: s3Url, user_id: userId }),
  });
  if (!res.ok) {
    throw new Error(`Image search failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function findSimilarProducts(
  file: File,
  category?: string,
): Promise<ImageSearchResponse> {
  const userId = getOrCreateUserId();
  const presigned = await presignUpload(userId, file);
  await uploadToS3(presigned.upload_url, file);
  return searchByImage(userId, presigned.public_url, category);
}

// --- Voice / text search ---

export interface VoiceMatch {
  id: string;
  name: string;
  image_s3_url: string;
  price: number | null;
  category: string | null;
}

export interface ExtractedFilters {
  category: string | null;
  price_band: string | null;
  age_group: string | null;
  usage: string | null;
}

export interface VoiceSearchResponse {
  search_history_id: string;
  transcript: string;
  extracted_filters: ExtractedFilters;
  matches: VoiceMatch[];
}

export interface VoiceSearchOverrides {
  category?: string;
  price_band?: string;
  age_group?: string;
  usage?: string;
}

// Caches by (transcript + filters) for the current customer's session —
// revisiting the same category or re-selecting a filter combo already seen
// this session reuses the stored result instead of hitting the backend
// again. Caches the in-flight promise itself (not just the resolved value)
// so two components asking for the same query at once share one network
// call. Cleared on "New User" (see clearVoiceSearchCache) so the next
// customer's session pulls live data — picking up any price/catalog changes
// since the kiosk was last reset — rather than serving stale results all day.
const voiceSearchCache = new Map<string, Promise<VoiceSearchResponse>>();

/** Call on "New User" so the next customer's session fetches fresh data. */
export function clearVoiceSearchCache(): void {
  voiceSearchCache.clear();
}

async function fetchVoiceSearch(
  transcript: string,
  overrides: VoiceSearchOverrides,
): Promise<VoiceSearchResponse> {
  const userId = getOrCreateUserId();
  const res = await fetch(`${API_BASE}/voice-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      user_id: userId,
      ...overrides,
    }),
  });
  if (!res.ok) {
    throw new Error(`Voice search failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Searches by transcript text (from voice or typed search), optionally with
 * explicit filter overrides (e.g. from the Refine Search preference pills)
 * that take precedence over whatever the backend's LLM extracts from the
 * transcript itself.
 */
export function voiceSearch(
  transcript: string,
  overrides: VoiceSearchOverrides = {},
): Promise<VoiceSearchResponse> {
  const cacheKey = JSON.stringify({ transcript, ...overrides });
  const cached = voiceSearchCache.get(cacheKey);
  if (cached) return cached;

  const promise = fetchVoiceSearch(transcript, overrides);
  voiceSearchCache.set(cacheKey, promise);
  // Don't cache failures — a transient network error shouldn't permanently
  // block retrying the same search later in the session.
  promise.catch(() => voiceSearchCache.delete(cacheKey));
  return promise;
}
