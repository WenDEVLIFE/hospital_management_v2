import type {
  AuthorizationListRow,
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
  Patient,
  PolicyListRow,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { pageSlice, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const POLICY_COLUMNS =
  "*, patients(id, medical_record_number, first_name, middle_name, last_name, suffix), insurance_providers(id, name, code, type, contact_number, integration_status, is_active)";

const PROVIDER_COLUMNS =
  "id, name, code, type, contact_number, integration_status, is_active";

const CLAIM_COLUMNS =
  "*, patients(id, medical_record_number, first_name, middle_name, last_name, suffix), insurance_providers(name), insurance_policies(policy_number)";

const AUTHORIZATION_COLUMNS =
  "*, patients(id, medical_record_number, first_name, middle_name, last_name, suffix), insurance_providers(name), insurance_policies(policy_number)";

type Relation<T> = T | T[] | null;

type PatientNameRow = {
  id: string;
  medical_record_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
};

type ProviderNameRow = Pick<
  InsuranceProvider,
  "id" | "name" | "code" | "type" | "contact_number" | "integration_status" | "is_active"
>;

type PolicyJoinRow = InsurancePolicy & {
  patients: Relation<PatientNameRow>;
  insurance_providers: Relation<ProviderNameRow>;
};

type ClaimJoinRow = InsuranceClaim & {
  patients: Relation<PatientNameRow>;
  insurance_providers: Relation<{ name: string }>;
  insurance_policies: Relation<{ policy_number: string }>;
};

type AuthorizationJoinRow = {
  id: string;
  authorization_number: string;
  patient_id: string;
  provider_id: string;
  policy_id: string;
  procedure_name: string;
  diagnosis: string;
  requested_at: string;
  status: AuthorizationListRow["status"];
  reference_number: string | null;
  approved_at: string | null;
  valid_until: string | null;
  notes: string | null;
  patients: Relation<PatientNameRow>;
  insurance_providers: Relation<{ name: string }>;
  insurance_policies: Relation<{ policy_number: string }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function fullName(row: {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
}): string {
  return [row.first_name, row.middle_name, row.last_name, row.suffix]
    .filter(Boolean)
    .join(" ");
}

function emptyStats(): InsuranceStats {
  return {
    activePolicies: 0,
    pendingVerifications: 0,
    pendingAuthorizations: 0,
    claimsInReview: 0,
    approvedClaims: 0,
    outstandingClaimAmount: 0,
  };
}

export async function listInsuranceProviders(): Promise<
  DataResult<InsuranceProvider[]>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("insurance_providers")
    .select(PROVIDER_COLUMNS)
    .order("name");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as InsuranceProvider[], error: null };
}

export async function listInsuranceBenefits(): Promise<
  DataResult<InsuranceBenefit[]>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("insurance_benefits")
    .select(
      "id, provider_id, name, coverage_type, case_rate, description, is_active"
    )
    .order("name");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as InsuranceBenefit[], error: null };
}

async function loadClaims(): Promise<DataResult<ClaimJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("insurance_claims")
    .select(CLAIM_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as ClaimJoinRow[], error: null };
}

export async function listInsurancePolicies(
  params: {
    q?: string;
    status?: string;
    verification?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<PolicyListRow>> {
  const supabase = await getSupabaseServerClient();
  const [policyResult, claimResult] = await Promise.all([
    supabase.from("insurance_policies").select(POLICY_COLUMNS).order("created_at", {
      ascending: false,
    }),
    supabase.from("insurance_claims").select("policy_id"),
  ]);

  if (policyResult.error) {
    return { data: null, error: toDataError(policyResult.error) };
  }

  const claimsByPolicy = new Map<string, number>();

  for (const claim of (claimResult.data ?? []) as Array<{ policy_id: string }>) {
    claimsByPolicy.set(claim.policy_id, (claimsByPolicy.get(claim.policy_id) ?? 0) + 1);
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = ((policyResult.data ?? []) as PolicyJoinRow[])
    .map((policy): PolicyListRow | null => {
      const patient = firstRelation(policy.patients);
      const provider = firstRelation(policy.insurance_providers);

      if (!patient || !provider) {
        return null;
      }

      return {
        id: policy.id,
        patient_id: policy.patient_id,
        provider_id: policy.provider_id,
        policy_number: policy.policy_number,
        member_number: policy.member_number,
        coverage_type: policy.coverage_type,
        effective_date: policy.effective_date,
        expiry_date: policy.expiry_date,
        status: policy.status,
        verification_status: policy.verification_status,
        last_verified_at: policy.last_verified_at,
        notes: policy.notes,
        created_at: policy.created_at,
        updated_at: policy.updated_at,
        patient_name: fullName(patient),
        patient_mrn: patient.medical_record_number,
        provider_name: provider.name,
        provider_type: provider.type,
        linked_claims: claimsByPolicy.get(policy.id) ?? 0,
      };
    })
    .filter((row): row is PolicyListRow => row !== null)
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (params.verification && row.verification_status !== params.verification) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [row.patient_name, row.patient_mrn, row.policy_number, row.member_number, row.provider_name]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function getInsurancePolicyDetails(): Promise<
  DataResult<Record<string, InsurancePolicyDetail>>
> {
  const policiesResult = await listInsurancePolicies({ pageSize: 500 });

  if (policiesResult.error) {
    return { data: null, error: policiesResult.error };
  }

  const policies = policiesResult.data?.rows ?? [];
  const policyIds = policies.map((policy) => policy.id);

  if (policyIds.length === 0) {
    return { data: {}, error: null };
  }

  const supabase = await getSupabaseServerClient();
  const [verificationResult, claimsResult, providerResult, patientResult] =
    await Promise.all([
      supabase
        .from("coverage_verifications")
        .select(
          "id, policy_id, status, reference_number, verified_at, verified_by, notes"
        )
        .in("policy_id", policyIds),
      loadClaims(),
      supabase.from("insurance_providers").select(PROVIDER_COLUMNS),
      supabase
        .from("patients")
        .select(
          "*, medical_record_number, first_name, middle_name, last_name, suffix"
        ),
    ]);

  const claims = claimsResult.error ? [] : claimsResult.data ?? [];
  const providers = new Map(
    ((providerResult.data ?? []) as InsuranceProvider[]).map((provider) => [
      provider.id,
      provider,
    ])
  );
  const patients = new Map(
    ((patientResult.data ?? []) as Patient[]).map((patient) => [patient.id, patient])
  );

  const verificationsByPolicy = new Map<string, CoverageVerification[]>();

  for (const row of (verificationResult.data ?? []) as Array<{
    id: string;
    policy_id: string;
    status: string;
    reference_number: string;
    verified_at: string;
    verified_by: string;
    notes: string | null;
  }>) {
    const list = verificationsByPolicy.get(row.policy_id) ?? [];
    list.push({
      id: row.id,
      policy_id: row.policy_id,
      status: row.status as CoverageVerification["status"],
      reference_number: row.reference_number,
      verified_at: row.verified_at,
      verified_by_name: "Staff",
      notes: row.notes,
    });
    verificationsByPolicy.set(row.policy_id, list);
  }

  const claimsByPolicy = new Map<string, ClaimListRow[]>();

  for (const claim of claims) {
    const patient = firstRelation(claim.patients);
    const provider = firstRelation(claim.insurance_providers);
    const policy = firstRelation(claim.insurance_policies);
    const list = claimsByPolicy.get(claim.policy_id) ?? [];

    list.push({
      ...claim,
      patient_name: patient ? fullName(patient) : "Unknown patient",
      patient_mrn: patient?.medical_record_number ?? "\u2014",
      provider_name: provider?.name ?? "Unknown provider",
      policy_number: policy?.policy_number ?? "\u2014",
      line_count: 0,
    });
    claimsByPolicy.set(claim.policy_id, list);
  }

  const details: Record<string, InsurancePolicyDetail> = {};

  for (const policy of policies) {
    const patient = patients.get(policy.patient_id);
    const provider = providers.get(policy.provider_id);

    if (!patient || !provider) {
      continue;
    }

    details[policy.id] = {
      policy,
      patient,
      provider,
      verifications: verificationsByPolicy.get(policy.id) ?? [],
      linked_claims: claimsByPolicy.get(policy.id) ?? [],
    };
  }

  return { data: details, error: null };
}

export async function listAuthorizations(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AuthorizationListRow>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("authorization_requests")
    .select(AUTHORIZATION_COLUMNS)
    .order("requested_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = ((data ?? []) as AuthorizationJoinRow[])
    .map((row) => {
      const patient = firstRelation(row.patients);
      const provider = firstRelation(row.insurance_providers);
      const policy = firstRelation(row.insurance_policies);

      return {
        id: row.id,
        authorization_number: row.authorization_number,
        patient_id: row.patient_id,
        provider_id: row.provider_id,
        policy_id: row.policy_id,
        procedure_name: row.procedure_name,
        diagnosis: row.diagnosis,
        requested_at: row.requested_at,
        status: row.status,
        reference_number: row.reference_number,
        approved_at: row.approved_at,
        valid_until: row.valid_until,
        notes: row.notes,
        patient_name: patient ? fullName(patient) : "Unknown patient",
        patient_mrn: patient?.medical_record_number ?? "\u2014",
        provider_name: provider?.name ?? "Unknown provider",
        policy_number: policy?.policy_number ?? "\u2014",
      } satisfies AuthorizationListRow;
    })
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [row.patient_name, row.procedure_name, row.provider_name, row.authorization_number]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function listClaims(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<ClaimListRow>> {
  const claimsResult = await loadClaims();

  if (claimsResult.error) {
    return { data: null, error: claimsResult.error };
  }

  const claims = claimsResult.data ?? [];
  const supabase = await getSupabaseServerClient();
  const { data: lineRows } = await supabase
    .from("insurance_claim_lines")
    .select("claim_id");

  const linesByClaim = new Map<string, number>();

  for (const line of (lineRows ?? []) as Array<{ claim_id: string }>) {
    linesByClaim.set(line.claim_id, (linesByClaim.get(line.claim_id) ?? 0) + 1);
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = claims
    .map((claim) => {
      const patient = firstRelation(claim.patients);
      const provider = firstRelation(claim.insurance_providers);
      const policy = firstRelation(claim.insurance_policies);

      return {
        id: claim.id,
        claim_number: claim.claim_number,
        patient_id: claim.patient_id,
        provider_id: claim.provider_id,
        policy_id: claim.policy_id,
        authorization_id: claim.authorization_id,
        claim_type: claim.claim_type,
        diagnosis: claim.diagnosis,
        total_charged: Number(claim.total_charged),
        amount_claimed: Number(claim.amount_claimed),
        amount_approved: Number(claim.amount_approved),
        amount_paid: Number(claim.amount_paid),
        status: claim.status as ClaimStatus,
        submitted_at: claim.submitted_at,
        adjudicated_at: claim.adjudicated_at,
        paid_at: claim.paid_at,
        notes: claim.notes,
        created_at: claim.created_at,
        updated_at: claim.updated_at,
        patient_name: patient ? fullName(patient) : "Unknown patient",
        patient_mrn: patient?.medical_record_number ?? "\u2014",
        provider_name: provider?.name ?? "Unknown provider",
        policy_number: policy?.policy_number ?? "\u2014",
        line_count: linesByClaim.get(claim.id) ?? 0,
      } satisfies ClaimListRow;
    })
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [row.claim_number, row.patient_name, row.patient_mrn, row.provider_name, row.diagnosis]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function getInsuranceClaimDetails(): Promise<
  DataResult<Record<string, InsuranceClaimDetail>>
> {
  const claimsResult = await listClaims({ pageSize: 500 });

  if (claimsResult.error) {
    return { data: null, error: claimsResult.error };
  }

  const claims = claimsResult.data?.rows ?? [];
  const claimIds = claims.map((claim) => claim.id);

  if (claimIds.length === 0) {
    return { data: {}, error: null };
  }

  const supabase = await getSupabaseServerClient();
  const [
    lineResult,
    eventResult,
    policyResult,
    providerResult,
    patientResult,
    profileResult,
  ] = await Promise.all([
    supabase
      .from("insurance_claim_lines")
      .select("id, claim_id, description, quantity, unit_amount, line_total")
      .in("claim_id", claimIds),
    supabase
      .from("insurance_claim_events")
      .select("id, claim_id, event_type, description, actor_id, created_at")
      .in("claim_id", claimIds)
      .order("created_at"),
    supabase.from("insurance_policies").select(POLICY_COLUMNS),
    supabase.from("insurance_providers").select(PROVIDER_COLUMNS),
    supabase
      .from("patients")
      .select("*")
      .in(
        "id",
        Array.from(new Set(claims.map((claim) => claim.patient_id)))
      ),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const linesByClaim = new Map<string, ClaimLine[]>();

  for (const line of (lineResult.data ?? []) as Array<{
    id: string;
    claim_id: string;
    description: string;
    quantity: number;
    unit_amount: number;
    line_total: number;
  }>) {
    const list = linesByClaim.get(line.claim_id) ?? [];
    list.push({
      id: line.id,
      claim_id: line.claim_id,
      description: line.description,
      quantity: Number(line.quantity),
      unit_amount: Number(line.unit_amount),
      line_total: Number(line.line_total),
    });
    linesByClaim.set(line.claim_id, list);
  }

  const actorNames = new Map(
    ((profileResult.data ?? []) as Array<{ id: string; full_name: string }>).map(
      (profile) => [profile.id, profile.full_name]
    )
  );

  const patientsById = new Map(
    ((patientResult.data ?? []) as Patient[]).map((patient) => [
      patient.id,
      patient,
    ])
  );

  const eventsByClaim = new Map<string, ClaimEvent[]>();

  for (const event of (eventResult.data ?? []) as Array<{
    id: string;
    claim_id: string;
    event_type: string;
    description: string;
    actor_id: string | null;
    created_at: string;
  }>) {
    const list = eventsByClaim.get(event.claim_id) ?? [];
    list.push({
      id: event.id,
      claim_id: event.claim_id,
      event_type: event.event_type,
      description: event.description,
      actor_name: event.actor_id
        ? actorNames.get(event.actor_id) ?? "Staff"
        : "System",
      created_at: event.created_at,
    });
    eventsByClaim.set(event.claim_id, list);
  }

  const policies = new Map(
    ((policyResult.data ?? []) as PolicyJoinRow[]).map((policy) => {
      const patient = firstRelation(policy.patients);
      const provider = firstRelation(policy.insurance_providers);

      return [
        policy.id,
        {
          ...policy,
          patient_name: patient ? fullName(patient) : "Unknown patient",
          patient_mrn: patient?.medical_record_number ?? "\u2014",
          provider_name: provider?.name ?? "Unknown provider",
          provider_type: provider?.type ?? "philhealth",
          linked_claims: 0,
        } satisfies PolicyListRow,
      ];
    })
  );

  const providers = new Map(
    ((providerResult.data ?? []) as InsuranceProvider[]).map((provider) => [
      provider.id,
      provider,
    ])
  );

  const details: Record<string, InsuranceClaimDetail> = {};

  for (const claim of claims) {
    const policy = policies.get(claim.policy_id);
    const provider = providers.get(claim.provider_id);
    const patientRow = patientsById.get(claim.patient_id);

    if (!policy || !provider || !patientRow) {
      continue;
    }

    details[claim.id] = {
      claim,
      patient: patientRow,
      provider,
      policy,
      lines: linesByClaim.get(claim.id) ?? [],
      events: eventsByClaim.get(claim.id) ?? [],
    };
  }

  return { data: details, error: null };
}

export async function getInsuranceStats(): Promise<DataResult<InsuranceStats>> {
  const supabase = await getSupabaseServerClient();
  const [policyResult, authorizationResult, claimResult] = await Promise.all([
    supabase
      .from("insurance_policies")
      .select("status, verification_status"),
    supabase.from("authorization_requests").select("status"),
    supabase
      .from("insurance_claims")
      .select("status, amount_claimed, amount_approved, amount_paid"),
  ]);

  if (policyResult.error) {
    return { data: null, error: toDataError(policyResult.error) };
  }

  if (claimResult.error) {
    return { data: null, error: toDataError(claimResult.error) };
  }

  const stats = emptyStats();

  for (const policy of (policyResult.data ?? []) as Array<{
    status: string;
    verification_status: string;
  }>) {
    if (policy.status === "active") {
      stats.activePolicies += 1;
    }

    if (policy.verification_status === "unverified") {
      stats.pendingVerifications += 1;
    }
  }

  for (const authorization of (authorizationResult.data ?? []) as Array<{
    status: string;
  }>) {
    if (authorization.status === "pending") {
      stats.pendingAuthorizations += 1;
    }
  }

  for (const claim of (claimResult.data ?? []) as Array<{
    status: string;
    amount_claimed: number;
    amount_approved: number;
    amount_paid: number;
  }>) {
    if (claim.status === "in_review" || claim.status === "submitted") {
      stats.claimsInReview += 1;
    }

    if (claim.status === "approved" || claim.status === "partially_approved") {
      stats.approvedClaims += 1;
    }

    const outstanding = Math.max(
      Number(claim.amount_approved) - Number(claim.amount_paid),
      0
    );
    stats.outstandingClaimAmount += outstanding;
  }

  return { data: stats, error: null };
}
