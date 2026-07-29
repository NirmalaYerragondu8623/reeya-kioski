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
