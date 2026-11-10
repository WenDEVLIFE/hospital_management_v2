"use client";

import * as React from "react";

import { Alert } from "@/components/ui/alert";
import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export const UNAVAILABLE_MESSAGE =
  "This action is not available yet because the Supabase backend is not connected.";

export type UnavailableActionProps = {
  label: string;
  description?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  /** Optional extra supporting copy rendered above the notice. */
  note?: string;
};

export function UnavailableAction({
  label,
  description,
  variant,
  size,
  icon,
  className,
  disabled,
  note,
}: UnavailableActionProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {icon}
        {label}
      </Button>

      <UnavailableActionDialog
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        description={description}
        note={note}
      />
    </>
  );
}

export type UnavailableActionDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  note?: string;
};

export function UnavailableActionDialog({
  open,
  onClose,
  title,
  description,
  note,
}: UnavailableActionDialogProps): React.JSX.Element {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {note ? (
        <p className="mb-3 text-sm leading-relaxed text-hospital-text-muted">
          {note}
        </p>
      ) : null}
      <Alert variant="info" title="Action unavailable">
        {UNAVAILABLE_MESSAGE}
      </Alert>
    </Modal>
  );
}
