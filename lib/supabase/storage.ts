import "server-only";

import type { DataResult } from "@/lib/data/result";
import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const STORAGE_BUCKETS = {
  patientDocuments: "patient-documents",
  laboratoryAttachments: "laboratory-attachments",
  radiologyFiles: "radiology-files",
} as const;

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export type StoredObject = {
  path: string;
  signedUrl: string;
  expiresIn: number;
};

function toStorageError(error: { message?: string | null }): {
  code: string;
  message: string;
} {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("bucket not found")) {
    return {
      code: "BUCKET_NOT_FOUND",
      message: "The storage bucket is not configured.",
    };
  }

  if (message.includes("exceeded the maximum allowed size")) {
    return {
      code: "FILE_TOO_LARGE",
      message: "This file is larger than the allowed limit.",
    };
  }

  if (message.includes("mime type")) {
    return {
      code: "UNSUPPORTED_TYPE",
      message: "This file type is not accepted.",
    };
  }

  if (message.includes("row-level security") || message.includes("denied")) {
    return {
      code: "42501",
      message: pgErrorMessage("42501"),
    };
  }

  return {
    code: "STORAGE_ERROR",
    message: "The file could not be processed. Try again.",
  };
}

/**
 * Paths are namespaced by owner scope so a single policy can reason about
 * them: `{scope}/{uuid}-{safeName}`. Scope is a patient id or an encounter id.
 */
export function buildStoragePath(
  scope: string,
  fileName: string,
  objectId: string
): string {
  const safeName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-80);

  return `${scope}/${objectId}-${safeName || "file"}`;
}

export async function uploadObject(params: {
  bucket: StorageBucket;
  scope: string;
  fileName: string;
  contentType: string;
  data: ArrayBuffer | Uint8Array | Blob;
}): Promise<DataResult<{ path: string }>> {
  const path = buildStoragePath(params.scope, params.fileName, crypto.randomUUID());
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.storage
    .from(params.bucket)
    .upload(path, params.data, {
      contentType: params.contentType,
      upsert: false,
    });

  if (error) {
    return { data: null, error: toStorageError(error) };
  }

  return { data: { path }, error: null };
}

export async function createSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn = 60
): Promise<DataResult<{ signedUrl: string }>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    return { data: null, error: toStorageError(error) };
  }

  if (!data?.signedUrl) {
    return {
      data: null,
      error: { code: "STORAGE_ERROR", message: "The file link could not be created." },
    };
  }

  return { data: { signedUrl: data.signedUrl }, error: null };
}

export async function removeObject(
  bucket: StorageBucket,
  path: string
): Promise<DataResult<{ removed: boolean }>> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    return { data: null, error: toStorageError(error) };
  }

  return { data: { removed: true }, error: null };
}

export async function listObjects(
  bucket: StorageBucket,
  scope: string
): Promise<DataResult<Array<{ name: string; size: number; updatedAt: string }>>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.storage.from(bucket).list(scope, {
    limit: 100,
    sortBy: { column: "updated_at", order: "desc" },
  });

  if (error) {
    return { data: null, error: toStorageError(error) };
  }

  return {
    data: (data ?? []).map((object) => ({
      name: object.name,
      size: object.metadata?.size ?? 0,
      updatedAt: object.updated_at ?? "",
    })),
    error: null,
  };
}
