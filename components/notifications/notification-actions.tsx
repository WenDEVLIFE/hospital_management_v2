"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BellIcon, SpeakerIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useCan } from "@/components/providers/permission-provider";
import {
  archiveAnnouncementAction,
  createAnnouncementAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  publishAnnouncementAction,
  saveNotificationPreferencesAction,
} from "@/app/(workspace)/notifications/actions";

type DepartmentOption = { id: string; name: string };

export function MarkAllReadAction() {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  async function handleClick() {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      const result = await markAllNotificationsReadAction();

      if (!result.ok) {
        toast({
          title: "Unable to mark notifications read",
          description: result.formError,
          variant: "danger",
        });
        return;
      }

      toast({
        title: "Notifications marked read",
        description: `${result.count ?? 0} notification${
          result.count === 1 ? "" : "s"
        } marked read.`,
        variant: "success",
      });
      router.refresh();
    } catch {
      toast({
        title: "Unable to mark notifications read",
        description: "Try again.",
        variant: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      loading={busy}
      onClick={handleClick}
    >
      <BellIcon className="size-4" aria-hidden="true" />
      Mark all read
    </Button>
  );
}

export function MarkReadAction({
  notificationId,
  isRead,
  onDone,
}: {
  notificationId: string;
  isRead: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  if (isRead) {
    return null;
  }

  async function handleClick() {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      const result = await markNotificationReadAction(notificationId);

      if (!result.ok) {
        toast({
          title: "Unable to mark read",
          description: result.formError,
          variant: "danger",
        });
        return;
      }

      toast({ title: "Notification marked read", variant: "success" });
      onDone?.();
      router.refresh();
    } catch {
      toast({
        title: "Unable to mark read",
        description: "Try again.",
        variant: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="secondary" loading={busy} onClick={handleClick}>
      Mark read
    </Button>
  );
}

const emptyAnnouncement = {
  title: "",
  body: "",
  audience: "all_staff",
  departmentId: "",
  pinned: false,
  publish: true,
  expiresAt: "",
};

export function NewAnnouncementAction({
  departments,
}: {
  departments: DepartmentOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState(emptyAnnouncement);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("notification.manage")) {
    return null;
  }

  function close() {
    if (submitting) {
      return;
    }

    setValues(emptyAnnouncement);
    setFormError(null);
    setOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const result = await createAnnouncementAction(values);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: values.publish ? "Announcement published" : "Draft saved",
        description: values.publish
          ? "Appropriate staff received an in-app notification."
          : "Publish it when you are ready.",
        variant: "success",
      });
      setValues(emptyAnnouncement);
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not save the announcement. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <SpeakerIcon className="size-4" aria-hidden="true" />
        New Announcement
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="New announcement"
        description="Publish to staff and deliver an in-app notification."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="announcement-form" loading={submitting}>
              {values.publish ? "Publish announcement" : "Save draft"}
            </Button>
          </>
        }
      >
        <form
          id="announcement-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to save">
              {formError}
            </Alert>
          ) : null}

          <FormField label="Title" htmlFor="ann_title" required>
            <Input
              id="ann_title"
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({ ...current, title: event.target.value }))
              }
            />
          </FormField>

          <FormField label="Body" htmlFor="ann_body" required>
            <Textarea
              id="ann_body"
              rows={4}
              value={values.body}
              onChange={(event) =>
                setValues((current) => ({ ...current, body: event.target.value }))
              }
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Audience" htmlFor="ann_audience" required>
              <Select
                id="ann_audience"
                value={values.audience}
                options={[
                  { label: "All staff", value: "all_staff" },
                  { label: "Physicians", value: "physicians" },
                  { label: "Nurses", value: "nurses" },
                  { label: "Department", value: "department" },
                ]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    audience: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Expires" htmlFor="ann_expires" hint="Optional.">
              <Input
                id="ann_expires"
                type="date"
                value={values.expiresAt}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    expiresAt: event.target.value,
                  }))
                }
              />
            </FormField>
          </div>

          {values.audience === "department" ? (
            <FormField label="Department" htmlFor="ann_department" required>
              <Select
                id="ann_department"
                value={values.departmentId}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    departmentId: event.target.value,
                  }))
                }
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-hospital-text">
              <Checkbox
                checked={values.pinned}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    pinned: event.target.checked,
                  }))
                }
              />
              Pin to the top of the announcement list
            </label>

            <label className="flex items-center gap-2 text-sm text-hospital-text">
              <Checkbox
                checked={values.publish}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    publish: event.target.checked,
                  }))
                }
              />
              Publish immediately and notify the audience
            </label>
          </div>

          <Alert variant="info" title="In-app delivery">
            Publishing creates one in-app notification per recipient. Staff who
            turned off announcement notifications are skipped.
          </Alert>
        </form>
      </Modal>
    </>
  );
}

export function AnnouncementStatusActions({
  announcement,
  onDone,
}: {
  announcement: { id: string; status: string };
  onDone: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [busy, setBusy] = React.useState<"publish" | "archive" | null>(null);

  if (!can("notification.manage") || announcement.status === "archived") {
    return null;
  }

  async function run(kind: "publish" | "archive") {
    if (busy) {
      return;
    }

    setBusy(kind);

    try {
      const result =
        kind === "publish"
          ? await publishAnnouncementAction(announcement.id)
          : await archiveAnnouncementAction(announcement.id);

      if (!result.ok) {
        toast({
          title: `Unable to ${kind} the announcement`,
          description: result.formError,
          variant: "danger",
        });
        return;
      }

      toast({
        title: kind === "publish" ? "Announcement published" : "Announcement archived",
        variant: "success",
      });
      onDone();
      router.refresh();
    } catch {
      toast({
        title: `Unable to ${kind} the announcement`,
        description: "Try again.",
        variant: "danger",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {announcement.status === "draft" ? (
        <Button
          size="sm"
          loading={busy === "publish"}
          onClick={() => run("publish")}
        >
          Publish announcement
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="secondary"
        loading={busy === "archive"}
        onClick={() => run("archive")}
      >
        Archive
      </Button>
    </div>
  );
}

export function SavePreferencesAction({
  preferences,
}: {
  preferences: Array<{ category: string; in_app: boolean }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  async function handleClick() {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      const result = await saveNotificationPreferencesAction({ preferences });

      if (!result.ok) {
        toast({
          title: "Unable to save preferences",
          description: result.formError,
          variant: "danger",
        });
        return;
      }

      toast({
        title: "Preferences saved",
        description: "Your in-app notification choices were stored.",
        variant: "success",
      });
      router.refresh();
    } catch {
      toast({
        title: "Unable to save preferences",
        description: "Try again.",
        variant: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" onClick={handleClick} loading={busy} size="md">
      Save preferences
    </Button>
  );
}
