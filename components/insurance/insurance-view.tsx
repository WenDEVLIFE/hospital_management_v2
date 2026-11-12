"use client";

import * as React from "react";
import {
  BillListIcon,
  ClipboardListIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from "@solar-icons/react/linear";

import type {
  AuthorizationListRow,
  ClaimListRow,
  InsuranceBenefit,
  InsuranceClaimDetail,
  InsurancePolicyDetail,
  InsuranceProvider,
  InsuranceProviderType,
  PolicyListRow,
} from "@/types/hospital";
import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { UNAVAILABLE_MESSAGE, UnavailableAction } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

const POLICY_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

const AUTHORIZATION_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "expired", label: "Expired" },
];

const CLAIM_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "prepared", label: "Prepared" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "partially_approved", label: "Partially approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
];

const PROVIDER_TYPE_LABELS: Record<InsuranceProviderType, string> = {
  philhealth: "PhilHealth",
  private_hmo: "Private HMO",
  private_insurer: "Private insurer",
  government: "Government",
};

export interface InsuranceViewProps {
  policies: PolicyListRow[];
  policyDetails: Record<string, InsurancePolicyDetail>;
  authorizations: AuthorizationListRow[];
  claims: ClaimListRow[];
  claimDetails: Record<string, InsuranceClaimDetail>;
  providers: InsuranceProvider[];
  benefits: InsuranceBenefit[];
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-hospital-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-hospital-text">{children}</dd>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-hospital-text-muted">
      <span aria-hidden="true">{icon}</span>
      {title}
    </h3>
  );
}

export function InsuranceView({
  policies,
  policyDetails,
  authorizations,
  claims,
  claimDetails,
  providers,
  benefits,
}: InsuranceViewProps) {
  const [tab, setTab] = React.useState("policies");
  const [selectedPolicy, setSelectedPolicy] = React.useState<PolicyListRow | null>(
    null
  );
  const [selectedClaim, setSelectedClaim] = React.useState<ClaimListRow | null>(
    null
  );
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const policyRowById = React.useMemo(
    () => new Map(policies.map((policy) => [policy.id, policy])),
    [policies]
  );
  const claimRowById = React.useMemo(
    () => new Map(claims.map((claim) => [claim.id, claim])),
    [claims]
  );

  const openPolicy = React.useCallback(
    (id: string) => {
      const row = policyRowById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedPolicy(row);
      }
    },
    [policyRowById]
  );

  const closePolicy = React.useCallback(() => {
    setPendingAction(null);
    setSelectedPolicy(null);
  }, []);

  const openClaim = React.useCallback(
    (id: string) => {
      const row = claimRowById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedClaim(row);
      }
    },
    [claimRowById]
  );

  const closeClaim = React.useCallback(() => {
    setPendingAction(null);
    setSelectedClaim(null);
  }, []);

  const providerNames = React.useMemo(
    () => providers.map((provider) => provider.name),
    [providers]
  );

  const policyColumns = React.useMemo<Column<PolicyListRow>[]>(
    () => [
      {
        key: "policy_number",
        header: "Policy No.",
        sortable: true,
        sortValue: (row) => row.policy_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.policy_number}
          </span>
        ),
      },
      {
        key: "patient",
        header: "Patient",
        sortable: true,
        sortValue: (row) => row.patient_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">{row.patient_name}</p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.patient_mrn}
            </p>
          </div>
        ),
      },
      {
        key: "provider",
        header: "Provider",
        sortable: true,
        sortValue: (row) => row.provider_name,
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <p>{row.provider_name}</p>
            <p className="text-[11px] text-hospital-text-muted">
              {PROVIDER_TYPE_LABELS[row.provider_type]}
            </p>
          </div>
        ),
      },
      {
        key: "coverage",
        header: "Coverage",
        cell: (row) => row.coverage_type,
      },
      {
        key: "validity",
        header: "Validity",
        sortable: true,
        sortValue: (row) => row.expiry_date,
        cell: (row) => (
          <span className="whitespace-nowrap text-xs">
            {formatDate(row.effective_date)} – {formatDate(row.expiry_date)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "verification",
        header: "Verification",
        cell: (row) => <StatusBadge status={row.verification_status} />,
      },
      {
        key: "claims",
        header: "Claims",
        align: "right",
        sortable: true,
        sortValue: (row) => row.linked_claims,
        cell: (row) => row.linked_claims,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View policy ${row.policy_number}`}
            onClick={() => openPolicy(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openPolicy]
  );

  const policyFilters = React.useMemo<FilterConfig<PolicyListRow>[]>(
    () => [
      {
        key: "provider",
        label: "provider",
        allLabel: "All providers",
        options: providerNames.map((name) => ({ label: name, value: name })),
        accessor: (row) => row.provider_name,
      },
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: POLICY_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    [providerNames]
  );

  const authorizationColumns = React.useMemo<Column<AuthorizationListRow>[]>(
    () => [
      {
        key: "authorization_number",
        header: "Authorization No.",
        sortable: true,
        sortValue: (row) => row.authorization_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.authorization_number}
          </span>
        ),
      },
      {
        key: "patient",
        header: "Patient",
        sortable: true,
        sortValue: (row) => row.patient_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">{row.patient_name}</p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.patient_mrn}
            </p>
          </div>
        ),
      },
      {
        key: "provider",
        header: "Provider",
        cell: (row) => row.provider_name,
      },
      {
        key: "procedure",
        header: "Procedure",
        cell: (row) => row.procedure_name,
      },
      {
        key: "requested",
        header: "Requested",
        sortable: true,
        sortValue: (row) => row.requested_at,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.requested_at)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "reference",
        header: "Reference",
        cell: (row) => row.reference_number ?? "\u2014",
      },
      {
        key: "valid_until",
        header: "Valid until",
        cell: (row) =>
          row.valid_until ? formatDate(row.valid_until) : "\u2014",
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View policy ${row.policy_number}`}
            onClick={() => openPolicy(row.policy_id)}
          >
            View policy
          </Button>
        ),
      },
    ],
    [openPolicy]
  );

  const authorizationFilters = React.useMemo<
    FilterConfig<AuthorizationListRow>[]
  >(
    () => [
      {
        key: "provider",
        label: "provider",
        allLabel: "All providers",
        options: providerNames.map((name) => ({ label: name, value: name })),
        accessor: (row) => row.provider_name,
      },
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: AUTHORIZATION_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    [providerNames]
  );

  const claimColumns = React.useMemo<Column<ClaimListRow>[]>(
    () => [
      {
        key: "claim_number",
        header: "Claim No.",
        sortable: true,
        sortValue: (row) => row.claim_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.claim_number}
          </span>
        ),
      },
      {
        key: "patient",
        header: "Patient",
        sortable: true,
        sortValue: (row) => row.patient_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">{row.patient_name}</p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.patient_mrn}
            </p>
          </div>
        ),
      },
      {
        key: "provider",
        header: "Provider",
        sortable: true,
        sortValue: (row) => row.provider_name,
        cell: (row) => row.provider_name,
      },
      {
        key: "type",
        header: "Type",
        cell: (row) => row.claim_type,
      },
      {
        key: "claimed",
        header: "Claimed",
        align: "right",
        cell: (row) => (
          <span className="tabular-nums">
            {formatCurrency(row.amount_claimed)}
          </span>
        ),
      },
      {
        key: "approved",
        header: "Approved",
        align: "right",
        cell: (row) => (
          <span className="tabular-nums">
            {formatCurrency(row.amount_approved)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "submitted",
        header: "Submitted",
        sortable: true,
        sortValue: (row) => row.submitted_at ?? "",
        cell: (row) =>
          row.submitted_at ? (
            <span className="whitespace-nowrap">
              {formatDateTime(row.submitted_at)}
            </span>
          ) : (
            "\u2014"
          ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View claim ${row.claim_number}`}
            onClick={() => openClaim(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openClaim]
  );

  const claimFilters = React.useMemo<FilterConfig<ClaimListRow>[]>(
    () => [
      {
        key: "provider",
        label: "provider",
        allLabel: "All providers",
        options: providerNames.map((name) => ({ label: name, value: name })),
        accessor: (row) => row.provider_name,
      },
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: CLAIM_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    [providerNames]
  );

  const policyDetail = selectedPolicy
    ? policyDetails[selectedPolicy.id] ?? null
    : null;
  const claimDetail = selectedClaim
    ? claimDetails[selectedClaim.id] ?? null
    : null;

  return (
    <>
      <div className="space-y-4">
        <Tabs
          items={[
            { value: "policies", label: "Policies", count: policies.length },
            {
              value: "authorizations",
              label: "Authorizations",
              count: authorizations.length,
            },
            { value: "claims", label: "Claims", count: claims.length },
            {
              value: "providers",
              label: "Providers & benefits",
              count: providers.length,
            },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "policies" ? (
          <RecordTable
            rows={policies}
            columns={policyColumns}
            rowKey={(row) => row.id}
            caption="Patient insurance policies"
            searchPlaceholder="Search policy no., patient, provider, or coverage"
            searchAccessor={(row) =>
              `${row.policy_number} ${row.member_number} ${row.patient_name} ${row.patient_mrn} ${row.provider_name} ${row.coverage_type}`
            }
            filters={policyFilters}
            emptyTitle="No insurance policies found"
            emptyDescription="There are no policies matching your selected filters."
            emptyIcon={<ShieldCheckIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "authorizations" ? (
          <RecordTable
            rows={authorizations}
            columns={authorizationColumns}
            rowKey={(row) => row.id}
            caption="Authorization requests"
            searchPlaceholder="Search authorization no., patient, procedure, or reference"
            searchAccessor={(row) =>
              `${row.authorization_number} ${row.patient_name} ${row.patient_mrn} ${row.provider_name} ${row.procedure_name} ${row.diagnosis} ${row.reference_number ?? ""}`
            }
            filters={authorizationFilters}
            toolbarActions={
              <UnavailableAction
                label="Request Authorization"
                description="File a prior authorization request with the insurer."
                size="sm"
                variant="secondary"
                icon={<ShieldCheckIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No authorization requests"
            emptyDescription="There are no authorization requests matching your selected filters."
            emptyIcon={
              <DocumentTextIcon className="size-5" aria-hidden="true" />
            }
            pageSize={10}
          />
        ) : null}

        {tab === "claims" ? (
          <div className="space-y-3">
            <Alert variant="info">
              Claims are recorded manually. No automatic PhilHealth or insurer
              submission, adjudication, or payment is performed in this build.
            </Alert>
            <RecordTable
              rows={claims}
              columns={claimColumns}
              rowKey={(row) => row.id}
              caption="Insurance claims"
              searchPlaceholder="Search claim no., patient, provider, or diagnosis"
              searchAccessor={(row) =>
                `${row.claim_number} ${row.patient_name} ${row.patient_mrn} ${row.provider_name} ${row.policy_number} ${row.diagnosis} ${row.claim_type}`
              }
              filters={claimFilters}
              toolbarActions={
                <UnavailableAction
                  label="Create Claim"
                  description="Prepare a new insurance claim from an encounter or admission."
                  size="sm"
                  variant="secondary"
                  icon={<BillListIcon className="size-4" aria-hidden="true" />}
                />
              }
              emptyTitle="No insurance claims found"
              emptyDescription="There are no claims matching your selected filters."
              emptyIcon={<BillListIcon className="size-5" aria-hidden="true" />}
              pageSize={10}
            />
          </div>
        ) : null}

        {tab === "providers" ? (
          <div className="space-y-3">
            <p className="text-[11px] text-hospital-text-muted">
              Benefit rates are reference values and must be confirmed against
              the current official provider rules. Integration status is shown
              for each provider.
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {providers.map((provider) => {
                const providerBenefits = benefits.filter(
                  (benefit) => benefit.provider_id === provider.id
                );

                return (
                  <section
                    key={provider.id}
                    aria-label={`${provider.name} benefits`}
                    className="rounded-md border border-hospital-border bg-white p-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-hospital-text">
                          {provider.name}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                          {provider.code} ·{" "}
                          {PROVIDER_TYPE_LABELS[provider.type]}
                        </p>
                        <p className="mt-1 text-[11px] text-hospital-text-muted">
                          {provider.contact_number ?? "No contact number"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={provider.integration_status} />
                        <StatusBadge
                          status={provider.is_active ? "active" : "inactive"}
                        />
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {providerBenefits.length === 0 ? (
                        <p className="text-xs text-hospital-text-muted">
                          No benefit configuration recorded.
                        </p>
                      ) : (
                        providerBenefits.map((benefit) => (
                          <div
                            key={benefit.id}
                            className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-medium text-hospital-text">
                                {benefit.name}
                              </p>
                              <Badge variant="info">
                                {formatCurrency(benefit.case_rate)}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                              {benefit.coverage_type} · {benefit.description}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        open={selectedPolicy !== null}
        onClose={closePolicy}
        title={
          selectedPolicy
            ? `Policy ${selectedPolicy.policy_number}`
            : "Insurance policy"
        }
        description="Membership, coverage, verification, and linked claims"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closePolicy}>
            Close
          </Button>
        }
      >
        {selectedPolicy ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Patient">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{selectedPolicy.patient_name}</span>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {selectedPolicy.patient_mrn}
                  </span>
                </div>
              </DetailField>

              <DetailField label="Provider">
                {selectedPolicy.provider_name}
              </DetailField>

              <DetailField label="Policy number">
                <span className="font-mono text-xs">
                  {selectedPolicy.policy_number}
                </span>
              </DetailField>

              <DetailField label="Member number">
                <span className="font-mono text-xs">
                  {selectedPolicy.member_number}
                </span>
              </DetailField>

              <DetailField label="Coverage type">
                {selectedPolicy.coverage_type}
              </DetailField>

              <DetailField label="Status">
                <StatusBadge status={selectedPolicy.status} />
              </DetailField>

              <DetailField label="Effective date">
                {formatDate(selectedPolicy.effective_date)}
              </DetailField>

              <DetailField label="Expiry date">
                {formatDate(selectedPolicy.expiry_date)}
              </DetailField>

              <DetailField label="Verification">
                <StatusBadge status={selectedPolicy.verification_status} />
              </DetailField>

              <DetailField label="Last verified">
                {selectedPolicy.last_verified_at
                  ? formatDateTime(selectedPolicy.last_verified_at)
                  : "Not verified"}
              </DetailField>
            </dl>

            {selectedPolicy.notes ? (
              <p className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2 text-xs text-hospital-text-muted">
                {selectedPolicy.notes}
              </p>
            ) : null}

            {policyDetail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<ShieldCheckIcon className="size-3.5" />}
                    title="Coverage verification records"
                  />
                  {policyDetail.verifications.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No verification records.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {policyDetail.verifications.map((verification) => (
                        <li
                          key={verification.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium text-hospital-text">
                              {verification.reference_number}
                            </p>
                            <p className="text-[11px] text-hospital-text-muted">
                              {verification.verified_by_name} ·{" "}
                              {formatDateTime(verification.verified_at)}
                            </p>
                            {verification.notes ? (
                              <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                                {verification.notes}
                              </p>
                            ) : null}
                          </div>
                          <StatusBadge status={verification.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<BillListIcon className="size-3.5" />}
                    title="Linked claims"
                  />
                  {policyDetail.linked_claims.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No claims linked to this policy.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {policyDetail.linked_claims.map((claim) => (
                        <li
                          key={claim.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div>
                            <p className="font-mono text-[11px] text-hospital-text">
                              {claim.claim_number}
                            </p>
                            <p className="text-[11px] text-hospital-text-muted">
                              {claim.claim_type} ·{" "}
                              {formatCurrency(claim.amount_claimed)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={claim.status} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openClaim(claim.id)}
                            >
                              View
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Verify coverage")}
                  >
                    Verify coverage
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Update policy")}
                  >
                    Update policy
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingAction("Request authorization")}
                  >
                    Request authorization
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={selectedClaim !== null}
        onClose={closeClaim}
        title={
          selectedClaim
            ? `Claim ${selectedClaim.claim_number}`
            : "Insurance claim"
        }
        description="Claim lines, status history, and payment monitoring"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeClaim}>
            Close
          </Button>
        }
      >
        {selectedClaim ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Patient">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{selectedClaim.patient_name}</span>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {selectedClaim.patient_mrn}
                  </span>
                </div>
              </DetailField>

              <DetailField label="Provider">
                {selectedClaim.provider_name}
              </DetailField>

              <DetailField label="Policy">
                <span className="font-mono text-xs">
                  {selectedClaim.policy_number}
                </span>
              </DetailField>

              <DetailField label="Claim type">
                {selectedClaim.claim_type}
              </DetailField>

              <DetailField label="Status">
                <StatusBadge status={selectedClaim.status} />
              </DetailField>

              <DetailField label="Diagnosis">
                {selectedClaim.diagnosis}
              </DetailField>

              <DetailField label="Total charged">
                {formatCurrency(selectedClaim.total_charged)}
              </DetailField>

              <DetailField label="Amount claimed">
                {formatCurrency(selectedClaim.amount_claimed)}
              </DetailField>

              <DetailField label="Amount approved">
                {formatCurrency(selectedClaim.amount_approved)}
              </DetailField>

              <DetailField label="Amount paid">
                {formatCurrency(selectedClaim.amount_paid)}
              </DetailField>

              <DetailField label="Submitted">
                {selectedClaim.submitted_at
                  ? formatDateTime(selectedClaim.submitted_at)
                  : "Not submitted"}
              </DetailField>

              <DetailField label="Adjudicated">
                {selectedClaim.adjudicated_at
                  ? formatDateTime(selectedClaim.adjudicated_at)
                  : "Not adjudicated"}
              </DetailField>

              <DetailField label="Paid">
                {selectedClaim.paid_at
                  ? formatDateTime(selectedClaim.paid_at)
                  : "Not paid"}
              </DetailField>
            </dl>

            {selectedClaim.notes ? (
              <p className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2 text-xs text-hospital-text-muted">
                {selectedClaim.notes}
              </p>
            ) : null}

            {claimDetail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<BillListIcon className="size-3.5" />}
                    title="Claim lines"
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claimDetail.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="text-right">
                            {line.quantity}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(line.unit_amount)}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(line.line_total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClipboardListIcon className="size-3.5" />}
                    title="Status history"
                  />
                  <ul className="space-y-1.5">
                    {claimDetail.events.map((event) => (
                      <li
                        key={event.id}
                        className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                      >
                        <p className="text-xs text-hospital-text">
                          {event.description}
                        </p>
                        <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                          {event.actor_name} ·{" "}
                          {formatDateTime(event.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Submit claim")}
                  >
                    Submit claim
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Record claim payment")}
                  >
                    Record payment
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Adjust claim")}
                  >
                    Adjust claim
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingAction("Generate claim report")}
                  >
                    Generate report
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
