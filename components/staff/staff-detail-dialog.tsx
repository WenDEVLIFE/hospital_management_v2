"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatIdentifier, formatName } from "@/lib/format";
import type { StaffListRow } from "@/types/hospital";

export interface StaffDetailDialogProps {
  staff: StaffListRow | null;
  onClose: () => void;
  onEdit: (staff: StaffListRow) => void;
  onDeactivate: (staff: StaffListRow) => void;
}

function DefinitionList({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-medium text-hospital-text-muted">
            {item.label}
          </dt>
          <dd className="mt-0.5 break-words text-sm text-hospital-text">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-hospital-border-subtle pt-5">
      <h3 className="text-sm font-semibold text-hospital-text">{title}</h3>
      {description ? (
        <p className="mt-1 text-xs text-hospital-text-muted">{description}</p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function StaffDetailDialog({
  staff,
  onClose,
  onEdit,
  onDeactivate,
}: StaffDetailDialogProps) {
  return (
    <Modal
      open={staff !== null}
      onClose={onClose}
      title="Staff record"
      description={staff ? formatName(staff) : undefined}
      size="lg"
      footer={
        staff ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="outline" onClick={() => onEdit(staff)}>
              Edit staff
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDeactivate(staff)}
            >
              Deactivate account
            </Button>
          </>
        ) : null
      }
    >
      {staff ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-hospital-border bg-hospital-surface p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-hospital-text">
                {formatName(staff)}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-hospital-text-muted">
                {formatIdentifier(staff.staff_number)}
              </p>
            </div>
            <StatusBadge status={staff.is_active ? "active" : "inactive"} />
          </div>

          <DetailSection title="Personal information">
            <DefinitionList
              items={[
                { label: "Full name", value: formatName(staff) },
                {
                  label: "Staff ID",
                  value: (
                    <span className="font-mono text-[11px]">
                      {formatIdentifier(staff.staff_number)}
                    </span>
                  ),
                },
                {
                  label: "Contact number",
                  value: staff.contact_number ?? "Not recorded",
                },
              ]}
            />
          </DetailSection>

          <DetailSection title="Professional information">
            <DefinitionList
              items={[
                {
                  label: "Role",
                  value:
                    staff.role_names.length > 0
                      ? staff.role_names.join(", ")
                      : "Not recorded",
                },
                {
                  label: "Specialty",
                  value: staff.specialty ?? "Not recorded",
                },
                {
                  label: "Employment type",
                  value: staff.employment_type ?? "Not recorded",
                },
                {
                  label: "Professional license number",
                  value: staff.professional_license_number ? (
                    <span>
                      {staff.professional_license_number}
                      <span className="mt-0.5 block text-[11px] text-hospital-text-muted">
                        Display only. License numbers are never used in links
                        or URLs.
                      </span>
                    </span>
                  ) : (
                    "Not recorded"
                  ),
                },
              ]}
            />
          </DetailSection>

          <DetailSection title="Department assignment">
            <DefinitionList
              items={[
                {
                  label: "Department",
                  value: staff.department_name ?? "Unassigned",
                },
              ]}
            />
          </DetailSection>

          <DetailSection
            title="Account & authentication"
            description="Authentication details are managed separately from employment information."
          >
            <DefinitionList
              items={[
                {
                  label: "Email",
                  value: (
                    <span className="break-all">{staff.email}</span>
                  ),
                },
                {
                  label: "Account status",
                  value: (
                    <StatusBadge
                      status={staff.is_active ? "active" : "inactive"}
                    />
                  ),
                },
                {
                  label: "User reference",
                  value: (
                    <span className="break-all font-mono text-[11px] text-hospital-text-muted">
                      {staff.user_id}
                    </span>
                  ),
                },
              ]}
            />
          </DetailSection>
        </div>
      ) : null}
    </Modal>
  );
}
