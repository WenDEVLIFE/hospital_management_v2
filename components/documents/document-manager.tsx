"use client";

import * as React from "react";
import {
  DocumentAddIcon,
  TrashBinTrashIcon,
  EyeIcon,
} from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useCan } from "@/components/providers/permission-provider";
import {
  deleteDocumentAction,
  getDocumentUrlAction,
  listDocumentsAction,
  uploadDocumentAction,
} from "@/app/(workspace)/documents/actions";

export type DocumentBucket =
  | "patient-documents"
  | "laboratory-attachments"
  | "radiology-files";

type StoredFile = { name: string; size: number; updatedAt: string };

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  if (!value) return "\u2014";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "\u2014"
    : date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export interface DocumentManagerProps {
  bucket: DocumentBucket;
  scope: string;
  title?: string;
  description?: string;
  uploadPermission: string;
  deletePermission?: string;
}

export function DocumentManager({
  bucket,
  scope,
  title = "Documents",
  description = "Uploaded files are private and opened through links that expire in two minutes.",
  uploadPermission,
  deletePermission,
}: DocumentManagerProps) {
  const { toast } = useToast();
  const can = useCan();
  const canUpload = can(uploadPermission);
  const canDelete = deletePermission ? can(deletePermission) : false;

  const [files, setFiles] = React.useState<StoredFile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<StoredFile | null>(
    null
  );
  const [deleting, setDeleting] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const result = await listDocumentsAction(bucket, scope);

    if (result.ok) {
      setFiles(result.files);
      setError(null);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [bucket, scope]);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await listDocumentsAction(bucket, scope);

      if (cancelled) {
        return;
      }

      if (result.ok) {
        setFiles(result.files);
        setError(null);
      } else {
        setError(result.error);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [bucket, scope]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || uploading) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("bucket", bucket);
      formData.set("scope", scope);
      formData.set("file", file);

      const result = await uploadDocumentAction(formData);

      if (!result.ok) {
        setError(result.error);
      } else {
        toast({
          title: "File uploaded",
          description: file.name,
          variant: "success",
        });
        await refresh();
      }
    } catch {
      setError("We could not upload the file. Try again.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleView(file: StoredFile) {
    const path = `${scope}/${file.name}`;
    const result = await getDocumentUrlAction(bucket, path);

    if (!result.ok || !result.url) {
      setError(result.ok ? "The file link could not be created." : result.error);
      return;
    }

    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) {
      return;
    }

    setDeleting(true);

    try {
      const result = await deleteDocumentAction(
        bucket,
        `${scope}/${deleteTarget.name}`
      );

      if (!result.ok) {
        setError(result.error);
      } else {
        toast({
          title: "File removed",
          description: deleteTarget.name,
          variant: "success",
        });
        setDeleteTarget(null);
        await refresh();
      }
    } catch {
      setError("We could not remove the file. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-hospital-text">{title}</h3>
          <p className="mt-0.5 text-[11px] text-hospital-text-muted">
            {description}
          </p>
        </div>

        {canUpload ? (
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-hospital-border bg-white px-3 text-sm text-hospital-text hover:bg-hospital-surface-muted">
            <DocumentAddIcon className="size-4" aria-hidden="true" />
            {uploading ? "Uploading…" : "Upload file"}
            <input
              type="file"
              className="sr-only"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
        ) : null}
      </div>

      {error ? (
        <Alert variant="danger" title="Document library">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <p className="text-xs text-hospital-text-muted">Loading documents…</p>
      ) : files.length === 0 ? (
        <EmptyState
          title="No documents"
          description={
            canUpload
              ? "Upload a PDF or image to attach it to this record."
              : "No files have been attached yet."
          }
          className="px-0 py-6"
        />
      ) : (
        <ul className="divide-y divide-hospital-border rounded-md border border-hospital-border">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-hospital-text">
                  {file.name.replace(/^[0-9a-f-]{36}-/i, "")}
                </p>
                <p className="text-[11px] text-hospital-text-muted">
                  {formatSize(file.size)} · {formatDate(file.updatedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Open ${file.name}`}
                  onClick={() => void handleView(file)}
                >
                  <EyeIcon className="size-3.5" aria-hidden="true" />
                  View
                </Button>
                {canDelete ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${file.name}`}
                    onClick={() => setDeleteTarget(file)}
                  >
                    <TrashBinTrashIcon className="size-3.5" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmationDialog
        open={deleteTarget !== null}
        onClose={() => (deleting ? undefined : setDeleteTarget(null))}
        onConfirm={handleDelete}
        title="Delete document"
        description={
          deleteTarget
            ? `Remove ${deleteTarget.name}? The file is deleted from storage and cannot be recovered.`
            : ""
        }
        confirmLabel="Delete file"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
