"use server";

import { revalidatePath } from "next/cache";

import {
  STORAGE_BUCKETS,
  createSignedUrl,
  listObjects,
  removeObject,
  uploadObject,
  type StorageBucket,
} from "@/lib/supabase/storage";

const BUCKET_VALUES = new Set<string>(Object.values(STORAGE_BUCKETS));
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 10 * 1024 * 1024;

export type DocumentListResult =
  | {
      ok: true;
      files: Array<{ name: string; size: number; updatedAt: string }>;
    }
  | { ok: false; error: string };

export type DocumentWriteResult =
  | { ok: true; path?: string; url?: string }
  | { ok: false; error: string };

function parseBucket(value: string | null): StorageBucket | null {
  return value && BUCKET_VALUES.has(value) ? (value as StorageBucket) : null;
}

function revalidateDocuments() {
  revalidatePath("/patients");
  revalidatePath("/laboratory");
  revalidatePath("/radiology");
}

export async function listDocumentsAction(
  bucketValue: string,
  scope: string
): Promise<DocumentListResult> {
  const bucket = parseBucket(bucketValue);

  if (!bucket) {
    return { ok: false, error: "Unknown document library." };
  }

  if (!UUID_PATTERN.test(scope)) {
    return { ok: false, error: "Invalid document scope." };
  }

  const result = await listObjects(bucket, scope);

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true, files: result.data };
}

export async function uploadDocumentAction(
  formData: FormData
): Promise<DocumentWriteResult> {
  const bucket = parseBucket(String(formData.get("bucket") ?? ""));
  const scope = String(formData.get("scope") ?? "");
  const file = formData.get("file");

  if (!bucket) {
    return { ok: false, error: "Unknown document library." };
  }

  if (!UUID_PATTERN.test(scope)) {
    return { ok: false, error: "Invalid document scope." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Files must be 10 MB or smaller." };
  }

  const result = await uploadObject({
    bucket,
    scope,
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    data: await file.arrayBuffer(),
  });

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  revalidateDocuments();

  return { ok: true, path: result.data.path };
}

export async function getDocumentUrlAction(
  bucketValue: string,
  path: string
): Promise<DocumentWriteResult> {
  const bucket = parseBucket(bucketValue);

  if (!bucket) {
    return { ok: false, error: "Unknown document library." };
  }

  const result = await createSignedUrl(bucket, path, 120);

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true, url: result.data.signedUrl };
}

export async function deleteDocumentAction(
  bucketValue: string,
  path: string
): Promise<DocumentWriteResult> {
  const bucket = parseBucket(bucketValue);

  if (!bucket) {
    return { ok: false, error: "Unknown document library." };
  }

  const result = await removeObject(bucket, path);

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  revalidateDocuments();

  return { ok: true };
}
