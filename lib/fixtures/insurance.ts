import type {
  AuthorizationListRow,
  AuthorizationRequest,
  ClaimEvent,
  ClaimLine,
  ClaimListRow,
  ClaimStatus,
  CoverageVerification,
  InsuranceBenefit,
  InsuranceClaim,
  InsuranceClaimDetail,
  InsurancePolicy,
  InsurancePolicyDetail,
  InsuranceProvider,
  InsuranceStats,
  PolicyListRow,
} from "@/types/hospital";
import {
  isoDate,
  isoAt,
  previewUuid,
  profileIds,
  profileNameById,
} from "./base";
import { patientMrnById, patientNameById, patients } from "./patients";

const billingOfficerName =
  profileNameById.get(profileIds.billing) ?? "Test Billing Staff A";
const hospitalAdminName =
  profileNameById.get(profileIds.hospitalAdmin) ?? "Test Admin B";

export const insuranceProviders: InsuranceProvider[] = [
  {
    id: previewUuid(90, 1),
    name: "PhilHealth",
    code: "PHIC",
    type: "philhealth",
    contact_number: "(02) 8441-7442",
    integration_status: "manual",
    is_active: true,
  },
  {
    id: previewUuid(90, 2),
    name: "Test Health Plan A",
    code: "HMO-A",
    type: "private_hmo",
    contact_number: "0917-200-0001",
    integration_status: "manual",
    is_active: true,
  },
  {
    id: previewUuid(90, 3),
    name: "Test Health Plan B",
    code: "HMO-B",
    type: "private_hmo",
    contact_number: "0917-200-0002",
    integration_status: "not_connected",
    is_active: true,
  },
  {
    id: previewUuid(90, 4),
    name: "Test Insurance A",
    code: "INS-A",
    type: "private_insurer",
    contact_number: "0917-200-0003",
    integration_status: "not_connected",
    is_active: true,
  },
];

export const insuranceProviderById = new Map(
  insuranceProviders.map((provider) => [provider.id, provider])
);

type PolicySeed = {
  patientIndex: number;
  providerIndex: number;
  coverageType: string;
  effectiveOffset: number;
  expiryOffset: number;
  status: InsurancePolicy["status"];
  verificationStatus: InsurancePolicy["verification_status"];
  lastVerifiedOffset: number | null;
  notes: string | null;
};

const POLICY_SEEDS: PolicySeed[] = [
  {
    patientIndex: 0,
    providerIndex: 0,
    coverageType: "PhilHealth case rate",
    effectiveOffset: -400,
    expiryOffset: 365,
    status: "active",
    verificationStatus: "verified",
    lastVerifiedOffset: -1,
    notes: "Manual eligibility check recorded; no live PhilHealth API.",
  },
  {
    patientIndex: 1,
    providerIndex: 0,
    coverageType: "PhilHealth case rate",
    effectiveOffset: -250,
    expiryOffset: 300,
    status: "active",
    verificationStatus: "unverified",
    lastVerifiedOffset: null,
    notes: "Awaiting manual membership verification.",
  },
  {
    patientIndex: 2,
    providerIndex: 1,
    coverageType: "HMO inpatient",
    effectiveOffset: -300,
    expiryOffset: 240,
    status: "active",
    verificationStatus: "verified",
    lastVerifiedOffset: -3,
    notes: "Eligibility confirmed by the provider portal.",
  },
  {
    patientIndex: 3,
    providerIndex: 1,
    coverageType: "HMO outpatient",
    effectiveOffset: -180,
    expiryOffset: 180,
    status: "active",
    verificationStatus: "failed",
    lastVerifiedOffset: -2,
    notes: "Provider reported a lapsed premium.",
  },
  {
    patientIndex: 4,
    providerIndex: 0,
    coverageType: "PhilHealth case rate",
    effectiveOffset: -500,
    expiryOffset: -30,
    status: "expired",
    verificationStatus: "verified",
    lastVerifiedOffset: -35,
    notes: "Policy expired before the current admission.",
  },
  {
    patientIndex: 5,
    providerIndex: 2,
    coverageType: "HMO inpatient",
    effectiveOffset: -60,
    expiryOffset: 300,
    status: "pending",
    verificationStatus: "unverified",
    lastVerifiedOffset: null,
    notes: "New enrollment awaiting activation.",
  },
  {
    patientIndex: 6,
    providerIndex: 3,
    coverageType: "Private insurance",
    effectiveOffset: -365,
    expiryOffset: 365,
    status: "active",
    verificationStatus: "verified",
    lastVerifiedOffset: -4,
    notes: "Coverage confirmed manually.",
  },
  {
    patientIndex: 7,
    providerIndex: 0,
    coverageType: "PhilHealth case rate",
    effectiveOffset: -200,
    expiryOffset: 200,
    status: "active",
    verificationStatus: "unverified",
    lastVerifiedOffset: null,
    notes: "Verification pending.",
  },
  {
    patientIndex: 8,
    providerIndex: 1,
    coverageType: "HMO outpatient",
    effectiveOffset: -400,
    expiryOffset: -10,
    status: "cancelled",
    verificationStatus: "failed",
    lastVerifiedOffset: -12,
    notes: "Policy cancelled by the provider.",
  },
];

export const insurancePolicies: InsurancePolicy[] = POLICY_SEEDS.map(
  (seed, index) => {
    const provider = insuranceProviders[seed.providerIndex];
    const policyNumber = `${provider.code}-2026-${String(index + 1).padStart(4, "0")}`;
    const lastVerifiedAt =
      seed.lastVerifiedOffset === null
        ? null
        : isoAt(seed.lastVerifiedOffset, 9);

    return {
      id: previewUuid(91, index + 1),
      patient_id: previewUuid(10, seed.patientIndex + 1),
      provider_id: provider.id,
      policy_number: policyNumber,
      member_number: `MEM-${String(index + 1).padStart(8, "0")}`,
      coverage_type: seed.coverageType,
      effective_date: isoDate(seed.effectiveOffset),
      expiry_date: isoDate(seed.expiryOffset),
      status: seed.status,
      verification_status: seed.verificationStatus,
      last_verified_at: lastVerifiedAt,
      notes: seed.notes,
      created_at: isoAt(seed.effectiveOffset, 8),
      updated_at: lastVerifiedAt ?? isoAt(seed.effectiveOffset, 8),
    };
  }
);

export const insurancePolicyById = new Map(
  insurancePolicies.map((policy) => [policy.id, policy])
);

export const coverageVerifications: CoverageVerification[] =
  insurancePolicies
    .filter(
      (policy) =>
        policy.verification_status === "verified" ||
        policy.verification_status === "failed"
    )
    .map((policy, index) => ({
      id: previewUuid(92, index + 1),
      policy_id: policy.id,
      status: policy.verification_status === "verified" ? "verified" : "failed",
      reference_number: `VER-2026-${String(index + 1).padStart(4, "0")}`,
      verified_at: policy.last_verified_at ?? isoAt(-1, 9),
      verified_by_name: billingOfficerName,
      notes:
        policy.verification_status === "verified"
          ? "Manual eligibility check recorded against the provider portal."
          : "Provider reported inactive membership or lapsed premium.",
    }));

const verificationsByPolicyId = new Map<string, CoverageVerification[]>();

for (const verification of coverageVerifications) {
  const list = verificationsByPolicyId.get(verification.policy_id) ?? [];
  list.push(verification);
  verificationsByPolicyId.set(verification.policy_id, list);
}

type AuthorizationSeed = {
  patientIndex: number;
  providerIndex: number;
  policyIndex: number;
  procedure: string;
  diagnosis: string;
  requestedOffset: number;
  status: AuthorizationRequest["status"];
  reference: string | null;
  approvedOffset: number | null;
  validUntilOffset: number | null;
  notes: string | null;
};

const AUTHORIZATION_SEEDS: AuthorizationSeed[] = [
  {
    patientIndex: 0,
    providerIndex: 0,
    policyIndex: 0,
    procedure: "Coronary angiography",
    diagnosis: "Acute coronary syndrome",
    requestedOffset: -3,
    status: "approved",
    reference: "AUTH-2026-0001",
    approvedOffset: -2,
    validUntilOffset: 14,
    notes: "Approved for the current admission.",
  },
  {
    patientIndex: 2,
    providerIndex: 1,
    policyIndex: 2,
    procedure: "Laparoscopic cholecystectomy",
    diagnosis: "Symptomatic cholelithiasis",
    requestedOffset: -1,
    status: "pending",
    reference: null,
    approvedOffset: null,
    validUntilOffset: null,
    notes: "Awaiting provider review.",
  },
  {
    patientIndex: 3,
    providerIndex: 1,
    policyIndex: 3,
    procedure: "ORIF distal radius",
    diagnosis: "Distal radius fracture",
    requestedOffset: -8,
    status: "denied",
    reference: "AUTH-2026-0002",
    approvedOffset: null,
    validUntilOffset: null,
    notes: "Procedure not covered under the current plan.",
  },
  {
    patientIndex: 5,
    providerIndex: 2,
    policyIndex: 5,
    procedure: "CT scan abdomen",
    diagnosis: "Abdominal pain",
    requestedOffset: -40,
    status: "expired",
    reference: "AUTH-2026-0003",
    approvedOffset: -38,
    validUntilOffset: -10,
    notes: "Authorization expired before the scheduled imaging.",
  },
  {
    patientIndex: 6,
    providerIndex: 3,
    policyIndex: 6,
    procedure: "Total thyroidectomy",
    diagnosis: "Multinodular goiter",
    requestedOffset: -10,
    status: "approved",
    reference: "AUTH-2026-0004",
    approvedOffset: -8,
    validUntilOffset: 20,
    notes: "Approved for inpatient surgery.",
  },
  {
    patientIndex: 7,
    providerIndex: 0,
    policyIndex: 7,
    procedure: "Cataract extraction",
    diagnosis: "Senile cataract",
    requestedOffset: -2,
    status: "pending",
    reference: null,
    approvedOffset: null,
    validUntilOffset: null,
    notes: "Awaiting PhilHealth review.",
  },
];

export const authorizationRequests: AuthorizationRequest[] =
  AUTHORIZATION_SEEDS.map((seed, index) => ({
    id: previewUuid(93, index + 1),
    authorization_number: `AUTH-2026-${String(index + 1).padStart(4, "0")}`,
    patient_id: previewUuid(10, seed.patientIndex + 1),
    provider_id: insuranceProviders[seed.providerIndex].id,
    policy_id: insurancePolicies[seed.policyIndex].id,
    procedure_name: seed.procedure,
    diagnosis: seed.diagnosis,
    requested_at: isoAt(seed.requestedOffset, 10),
    status: seed.status,
    reference_number: seed.reference,
    approved_at:
      seed.approvedOffset === null ? null : isoAt(seed.approvedOffset, 11),
    valid_until:
      seed.validUntilOffset === null ? null : isoDate(seed.validUntilOffset),
    notes: seed.notes,
  }));

export const authorizationListRows: AuthorizationListRow[] =
  authorizationRequests.map((request) => {
    const policy = insurancePolicyById.get(request.policy_id);
    const provider = insuranceProviderById.get(request.provider_id);

    return {
      ...request,
      patient_name:
        patientNameById.get(request.patient_id) ?? "Test Patient",
      patient_mrn:
        patientMrnById.get(request.patient_id) ?? "MRN-2026-0000",
      provider_name: provider?.name ?? "Unknown provider",
      policy_number: policy?.policy_number ?? "Unknown policy",
    };
  });

type ClaimSeed = {
  patientIndex: number;
  providerIndex: number;
  policyIndex: number;
  authorizationIndex: number | null;
  claimType: string;
  diagnosis: string;
  amountClaimed: number;
  amountApproved: number;
  amountPaid: number;
  status: ClaimStatus;
  submittedOffset: number | null;
  adjudicatedOffset: number | null;
  paidOffset: number | null;
  notes: string | null;
  lines: { description: string; quantity: number; unitAmount: number }[];
};

const CLAIM_SEEDS: ClaimSeed[] = [
  {
    patientIndex: 0,
    providerIndex: 0,
    policyIndex: 0,
    authorizationIndex: 0,
    claimType: "Inpatient",
    diagnosis: "Acute coronary syndrome",
    amountClaimed: 85000,
    amountApproved: 70000,
    amountPaid: 70000,
    status: "paid",
    submittedOffset: -45,
    adjudicatedOffset: -30,
    paidOffset: -20,
    notes: "Paid in full.",
    lines: [
      { description: "Room and board", quantity: 1, unitAmount: 60000 },
      { description: "Professional fees", quantity: 1, unitAmount: 35000 },
      { description: "Laboratory", quantity: 1, unitAmount: 15000 },
      { description: "Pharmacy", quantity: 1, unitAmount: 10000 },
    ],
  },
  {
    patientIndex: 1,
    providerIndex: 0,
    policyIndex: 1,
    authorizationIndex: null,
    claimType: "Inpatient",
    diagnosis: "Community-acquired pneumonia",
    amountClaimed: 50000,
    amountApproved: 0,
    amountPaid: 0,
    status: "submitted",
    submittedOffset: -3,
    adjudicatedOffset: null,
    paidOffset: null,
    notes: "Submitted; awaiting adjudication.",
    lines: [
      { description: "Room and board", quantity: 1, unitAmount: 35000 },
      { description: "Professional fees", quantity: 1, unitAmount: 20000 },
      { description: "Laboratory", quantity: 1, unitAmount: 10000 },
    ],
  },
  {
    patientIndex: 2,
    providerIndex: 1,
    policyIndex: 2,
    authorizationIndex: 1,
    claimType: "Inpatient",
    diagnosis: "Symptomatic cholelithiasis",
    amountClaimed: 75000,
    amountApproved: 60000,
    amountPaid: 0,
    status: "approved",
    submittedOffset: -15,
    adjudicatedOffset: -5,
    paidOffset: null,
    notes: "Approved; payment pending.",
    lines: [
      { description: "Room and board", quantity: 1, unitAmount: 50000 },
      { description: "Professional fees", quantity: 1, unitAmount: 30000 },
      { description: "Laboratory", quantity: 1, unitAmount: 18000 },
    ],
  },
  {
    patientIndex: 3,
    providerIndex: 1,
    policyIndex: 3,
    authorizationIndex: null,
    claimType: "Outpatient",
    diagnosis: "Distal radius fracture",
    amountClaimed: 35000,
    amountApproved: 25000,
    amountPaid: 0,
    status: "partially_approved",
    submittedOffset: -10,
    adjudicatedOffset: -2,
    paidOffset: null,
    notes: "Partially approved; two line items reduced.",
    lines: [
      { description: "Professional fees", quantity: 1, unitAmount: 25000 },
      { description: "Imaging", quantity: 1, unitAmount: 12000 },
      { description: "Supplies", quantity: 1, unitAmount: 8000 },
    ],
  },
  {
    patientIndex: 4,
    providerIndex: 0,
    policyIndex: 4,
    authorizationIndex: null,
    claimType: "Inpatient",
    diagnosis: "Acute asthma exacerbation",
    amountClaimed: 110000,
    amountApproved: 0,
    amountPaid: 0,
    status: "rejected",
    submittedOffset: -30,
    adjudicatedOffset: -25,
    paidOffset: null,
    notes: "Rejected: membership expired at admission.",
    lines: [
      { description: "Room and board", quantity: 1, unitAmount: 80000 },
      { description: "Professional fees", quantity: 1, unitAmount: 45000 },
      { description: "Pharmacy", quantity: 1, unitAmount: 25000 },
    ],
  },
  {
    patientIndex: 5,
    providerIndex: 2,
    policyIndex: 5,
    authorizationIndex: 3,
    claimType: "Outpatient",
    diagnosis: "Abdominal pain",
    amountClaimed: 25000,
    amountApproved: 0,
    amountPaid: 0,
    status: "in_review",
    submittedOffset: -6,
    adjudicatedOffset: null,
    paidOffset: null,
    notes: "In review; additional clinical documents requested.",
    lines: [
      { description: "Imaging", quantity: 1, unitAmount: 18000 },
      { description: "Professional fees", quantity: 1, unitAmount: 8000 },
      { description: "Laboratory", quantity: 1, unitAmount: 4000 },
    ],
  },
  {
    patientIndex: 6,
    providerIndex: 3,
    policyIndex: 6,
    authorizationIndex: 4,
    claimType: "Inpatient",
    diagnosis: "Multinodular goiter",
    amountClaimed: 140000,
    amountApproved: 120000,
    amountPaid: 0,
    status: "approved",
    submittedOffset: -12,
    adjudicatedOffset: -4,
    paidOffset: null,
    notes: "Approved; awaiting payment.",
    lines: [
      { description: "Room and board", quantity: 1, unitAmount: 90000 },
      { description: "Professional fees", quantity: 1, unitAmount: 60000 },
      { description: "Laboratory", quantity: 1, unitAmount: 30000 },
    ],
  },
  {
    patientIndex: 7,
    providerIndex: 0,
    policyIndex: 7,
    authorizationIndex: null,
    claimType: "Outpatient",
    diagnosis: "Senile cataract",
    amountClaimed: 18000,
    amountApproved: 0,
    amountPaid: 0,
    status: "prepared",
    submittedOffset: null,
    adjudicatedOffset: null,
    paidOffset: null,
    notes: "Prepared; awaiting final document review.",
    lines: [
      { description: "Professional fees", quantity: 1, unitAmount: 12000 },
      { description: "Supplies", quantity: 1, unitAmount: 6000 },
      { description: "Medication", quantity: 1, unitAmount: 4000 },
    ],
  },
  {
    patientIndex: 8,
    providerIndex: 1,
    policyIndex: 8,
    authorizationIndex: null,
    claimType: "Outpatient",
    diagnosis: "Allergic contact dermatitis",
    amountClaimed: 20000,
    amountApproved: 0,
    amountPaid: 0,
    status: "draft",
    submittedOffset: null,
    adjudicatedOffset: null,
    paidOffset: null,
    notes: "Draft; policy status needs verification.",
    lines: [
      { description: "Professional fees", quantity: 1, unitAmount: 15000 },
      { description: "Medication", quantity: 1, unitAmount: 8000 },
      { description: "Supplies", quantity: 1, unitAmount: 5000 },
    ],
  },
];

export const insuranceClaims: InsuranceClaim[] = CLAIM_SEEDS.map(
  (seed, index) => {
    const submittedAt =
      seed.submittedOffset === null ? null : isoAt(seed.submittedOffset, 10);
    const adjudicatedAt =
      seed.adjudicatedOffset === null
        ? null
        : isoAt(seed.adjudicatedOffset, 14);
    const paidAt =
      seed.paidOffset === null ? null : isoAt(seed.paidOffset, 9);
    const totalCharged = seed.lines.reduce(
      (total, line) => total + line.quantity * line.unitAmount,
      0
    );

    return {
      id: previewUuid(94, index + 1),
      claim_number: `CLM-2026-${String(index + 1).padStart(4, "0")}`,
      patient_id: previewUuid(10, seed.patientIndex + 1),
      provider_id: insuranceProviders[seed.providerIndex].id,
      policy_id: insurancePolicies[seed.policyIndex].id,
      authorization_id:
        seed.authorizationIndex === null
          ? null
          : authorizationRequests[seed.authorizationIndex].id,
      claim_type: seed.claimType,
      diagnosis: seed.diagnosis,
      total_charged: totalCharged,
      amount_claimed: seed.amountClaimed,
      amount_approved: seed.amountApproved,
      amount_paid: seed.amountPaid,
      status: seed.status,
      submitted_at: submittedAt,
      adjudicated_at: adjudicatedAt,
      paid_at: paidAt,
      notes: seed.notes,
      created_at: isoAt((seed.submittedOffset ?? -5) - 1, 9),
      updated_at: paidAt ?? adjudicatedAt ?? submittedAt ?? isoAt(-5, 9),
    };
  }
);

export const insuranceClaimById = new Map(
  insuranceClaims.map((claim) => [claim.id, claim])
);

const claimLinesByClaimId = new Map<string, ClaimLine[]>();
const claimEventsByClaimId = new Map<string, ClaimEvent[]>();
let claimLineIndex = 0;
let claimEventIndex = 0;

CLAIM_SEEDS.forEach((seed, index) => {
  const claim = insuranceClaims[index];
  const lines: ClaimLine[] = seed.lines.map((line) => {
    claimLineIndex += 1;

    return {
      id: previewUuid(95, claimLineIndex),
      claim_id: claim.id,
      description: line.description,
      quantity: line.quantity,
      unit_amount: line.unitAmount,
      line_total: line.quantity * line.unitAmount,
    };
  });

  claimLinesByClaimId.set(claim.id, lines);

  const events: ClaimEvent[] = [
    {
      id: previewUuid(96, ++claimEventIndex),
      claim_id: claim.id,
      event_type: "created",
      description: "Claim record created.",
      actor_name: billingOfficerName,
      created_at: claim.created_at,
    },
  ];

  if (claim.submitted_at) {
    events.push({
      id: previewUuid(96, ++claimEventIndex),
      claim_id: claim.id,
      event_type: "submitted",
      description: "Claim submitted to the provider.",
      actor_name: billingOfficerName,
      created_at: claim.submitted_at,
    });
  }

  if (claim.status === "in_review") {
    events.push({
      id: previewUuid(96, ++claimEventIndex),
      claim_id: claim.id,
      event_type: "in_review",
      description: "Provider requested additional clinical documents.",
      actor_name: hospitalAdminName,
      created_at: isoAt(-2, 11),
    });
  }

  if (claim.adjudicated_at) {
    events.push({
      id: previewUuid(96, ++claimEventIndex),
      claim_id: claim.id,
      event_type: "adjudicated",
      description:
        claim.status === "rejected"
          ? "Claim rejected by the provider."
          : claim.status === "partially_approved"
            ? "Claim partially approved with line-item adjustments."
            : "Claim approved by the provider.",
      actor_name: hospitalAdminName,
      created_at: claim.adjudicated_at,
    });
  }

  if (claim.paid_at) {
    events.push({
      id: previewUuid(96, ++claimEventIndex),
      claim_id: claim.id,
      event_type: "paid",
      description: "Provider payment recorded.",
      actor_name: billingOfficerName,
      created_at: claim.paid_at,
    });
  }

  claimEventsByClaimId.set(claim.id, events);
});

export const insuranceClaimListRows: ClaimListRow[] = insuranceClaims.map(
  (claim) => {
    const policy = insurancePolicyById.get(claim.policy_id);
    const provider = insuranceProviderById.get(claim.provider_id);

    return {
      ...claim,
      patient_name: patientNameById.get(claim.patient_id) ?? "Test Patient",
      patient_mrn: patientMrnById.get(claim.patient_id) ?? "MRN-2026-0000",
      provider_name: provider?.name ?? "Unknown provider",
      policy_number: policy?.policy_number ?? "Unknown policy",
      line_count: (claimLinesByClaimId.get(claim.id) ?? []).length,
    };
  }
);

export const insuranceClaimDetailById = new Map<string, InsuranceClaimDetail>(
  insuranceClaims.map((claim) => {
    const patient = patients.find((item) => item.id === claim.patient_id);
    const provider = insuranceProviderById.get(claim.provider_id);
    const policy = insurancePolicyById.get(claim.policy_id);

    if (!patient || !provider || !policy) {
      throw new Error(`Insurance fixture is missing claim dependencies for ${claim.id}`);
    }

    return [
      claim.id,
      {
        claim,
        patient,
        provider,
        policy,
        lines: claimLinesByClaimId.get(claim.id) ?? [],
        events: claimEventsByClaimId.get(claim.id) ?? [],
      },
    ];
  })
);

export const insurancePolicyListRows: PolicyListRow[] = insurancePolicies.map(
  (policy) => {
    const provider = insuranceProviderById.get(policy.provider_id);

    return {
      ...policy,
      patient_name: patientNameById.get(policy.patient_id) ?? "Test Patient",
      patient_mrn:
        patientMrnById.get(policy.patient_id) ?? "MRN-2026-0000",
      provider_name: provider?.name ?? "Unknown provider",
      provider_type: provider?.type ?? "private_insurer",
      linked_claims: insuranceClaimListRows.filter(
        (claim) => claim.policy_id === policy.id
      ).length,
    };
  }
);

export const insurancePolicyDetailById = new Map<
  string,
  InsurancePolicyDetail
>(
  insurancePolicies.map((policy) => {
    const patient = patients.find((item) => item.id === policy.patient_id);
    const provider = insuranceProviderById.get(policy.provider_id);

    if (!patient || !provider) {
      throw new Error(`Insurance fixture is missing policy dependencies for ${policy.id}`);
    }

    return [
      policy.id,
      {
        policy,
        patient,
        provider,
        verifications: verificationsByPolicyId.get(policy.id) ?? [],
        linked_claims: insuranceClaimListRows.filter(
          (claim) => claim.policy_id === policy.id
        ),
      },
    ];
  })
);

export const insuranceBenefits: InsuranceBenefit[] = [
  {
    id: previewUuid(97, 1),
    provider_id: insuranceProviders[0].id,
    name: "PhilHealth case rate — medical",
    coverage_type: "Case rate",
    case_rate: 25000,
    description: "Reference case rate for medical admissions; confirm against current PhilHealth rules.",
    is_active: true,
  },
  {
    id: previewUuid(97, 2),
    provider_id: insuranceProviders[0].id,
    name: "PhilHealth case rate — surgical",
    coverage_type: "Case rate",
    case_rate: 45000,
    description: "Reference case rate for surgical admissions; confirm against current PhilHealth rules.",
    is_active: true,
  },
  {
    id: previewUuid(97, 3),
    provider_id: insuranceProviders[0].id,
    name: "Hemodialysis",
    coverage_type: "Case rate",
    case_rate: 6000,
    description: "Per-session reference amount; subject to current PhilHealth rules.",
    is_active: true,
  },
  {
    id: previewUuid(97, 4),
    provider_id: insuranceProviders[1].id,
    name: "Inpatient coverage",
    coverage_type: "Inpatient",
    case_rate: 100000,
    description: "Plan-specific maximum; verify against the member policy.",
    is_active: true,
  },
  {
    id: previewUuid(97, 5),
    provider_id: insuranceProviders[1].id,
    name: "Outpatient consultation",
    coverage_type: "Outpatient",
    case_rate: 1500,
    description: "Per-consultation reference amount.",
    is_active: true,
  },
  {
    id: previewUuid(97, 6),
    provider_id: insuranceProviders[2].id,
    name: "Inpatient coverage",
    coverage_type: "Inpatient",
    case_rate: 80000,
    description: "Plan-specific maximum; verify against the member policy.",
    is_active: true,
  },
  {
    id: previewUuid(97, 7),
    provider_id: insuranceProviders[3].id,
    name: "Surgical benefit",
    coverage_type: "Surgical",
    case_rate: 120000,
    description: "Plan-specific maximum; verify against the member policy.",
    is_active: true,
  },
];

export const insuranceStats: InsuranceStats = {
  activePolicies: insurancePolicies.filter(
    (policy) => policy.status === "active"
  ).length,
  pendingVerifications: insurancePolicies.filter(
    (policy) => policy.verification_status === "unverified"
  ).length,
  pendingAuthorizations: authorizationRequests.filter(
    (request) => request.status === "pending"
  ).length,
  claimsInReview: insuranceClaims.filter(
    (claim) => claim.status === "submitted" || claim.status === "in_review"
  ).length,
  approvedClaims: insuranceClaims.filter(
    (claim) => claim.status === "approved" || claim.status === "paid"
  ).length,
  outstandingClaimAmount: insuranceClaims
    .filter(
      (claim) =>
        claim.status === "submitted" ||
        claim.status === "in_review" ||
        claim.status === "approved" ||
        claim.status === "partially_approved"
    )
    .reduce(
      (total, claim) =>
        total +
        (claim.amount_approved > 0
          ? Math.max(0, claim.amount_approved - claim.amount_paid)
          : claim.amount_claimed),
      0
    ),
};
