import type {
  AuthorizationListRow,
  ClaimListRow,
  InsuranceBenefit,
  InsuranceClaimDetail,
  InsurancePolicyDetail,
  InsuranceProvider,
  InsuranceStats,
  PolicyListRow,
} from "@/types/hospital";
import {
  authorizationListRows,
  insuranceBenefits,
  insuranceClaimDetailById,
  insuranceClaimListRows,
  insurancePolicyDetailById,
  insurancePolicyListRows,
  insuranceProviders,
  insuranceStats,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import {
  emptyPage,
  matchesQuery,
  pageSlice,
  sortByDateDesc,
} from "./query";
import type { DataResult, PagedResult } from "./result";

const POLICY_NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested insurance policy could not be found.",
} as const;

const CLAIM_NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested insurance claim could not be found.",
} as const;

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

export async function listInsurancePolicies(
  params: {
    q?: string;
    provider?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<PolicyListRow>> {
  // TODO(supabase): replace with supabase.from("insurance_policies").select("*")
  if (!isPreviewMode) {
    return emptyPage<PolicyListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = insurancePolicyListRows.filter((policy) => {
    if (params.provider && policy.provider_name !== params.provider) {
      return false;
    }

    if (params.status && policy.status !== params.status) {
      return false;
    }

    return matchesQuery(params.q, [
      policy.policy_number,
      policy.member_number,
      policy.patient_name,
      policy.patient_mrn,
      policy.provider_name,
      policy.coverage_type,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getInsurancePolicyDetails(): Promise<
  DataResult<Record<string, InsurancePolicyDetail>>
> {
  // TODO(supabase): replace with a joined policy detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(insurancePolicyDetailById),
    error: null,
  };
}

export async function getInsurancePolicyDetail(
  id: string
): Promise<DataResult<InsurancePolicyDetail>> {
  // TODO(supabase): replace with supabase.from("insurance_policies").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: POLICY_NOT_FOUND };
  }

  await Promise.resolve();

  const detail = insurancePolicyDetailById.get(id);

  if (!detail) {
    return { data: null, error: POLICY_NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function listAuthorizations(
  params: {
    q?: string;
    status?: string;
    provider?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AuthorizationListRow>> {
  // TODO(supabase): replace with supabase.from("authorization_requests").select("*")
  if (!isPreviewMode) {
    return emptyPage<AuthorizationListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = authorizationListRows.filter((authorization) => {
    if (params.status && authorization.status !== params.status) {
      return false;
    }

    if (params.provider && authorization.provider_name !== params.provider) {
      return false;
    }

    return matchesQuery(params.q, [
      authorization.authorization_number,
      authorization.patient_name,
      authorization.patient_mrn,
      authorization.provider_name,
      authorization.policy_number,
      authorization.procedure_name,
      authorization.diagnosis,
      authorization.reference_number,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listClaims(
  params: {
    q?: string;
    status?: string;
    provider?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<ClaimListRow>> {
  // TODO(supabase): replace with supabase.from("insurance_claims").select("*")
  if (!isPreviewMode) {
    return emptyPage<ClaimListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = sortByDateDesc(
    insuranceClaimListRows.filter((claim) => {
      if (params.status && claim.status !== params.status) {
        return false;
      }

      if (params.provider && claim.provider_name !== params.provider) {
        return false;
      }

      return matchesQuery(params.q, [
        claim.claim_number,
        claim.patient_name,
        claim.patient_mrn,
        claim.provider_name,
        claim.policy_number,
        claim.diagnosis,
        claim.claim_type,
      ]);
    }),
    (claim) => claim.submitted_at ?? claim.created_at
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getInsuranceClaimDetails(): Promise<
  DataResult<Record<string, InsuranceClaimDetail>>
> {
  // TODO(supabase): replace with a joined claim detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(insuranceClaimDetailById),
    error: null,
  };
}

export async function getInsuranceClaimDetail(
  id: string
): Promise<DataResult<InsuranceClaimDetail>> {
  // TODO(supabase): replace with supabase.from("insurance_claims").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: CLAIM_NOT_FOUND };
  }

  await Promise.resolve();

  const detail = insuranceClaimDetailById.get(id);

  if (!detail) {
    return { data: null, error: CLAIM_NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function listInsuranceProviders(): Promise<
  DataResult<InsuranceProvider[]>
> {
  // TODO(supabase): replace with supabase.from("insurance_providers").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: insuranceProviders, error: null };
}

export async function listInsuranceBenefits(): Promise<
  DataResult<InsuranceBenefit[]>
> {
  // TODO(supabase): replace with supabase.from("insurance_benefits").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: insuranceBenefits, error: null };
}

export async function getInsuranceStats(): Promise<
  DataResult<InsuranceStats>
> {
  // TODO(supabase): replace with aggregate queries over policies and claims
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  return { data: insuranceStats, error: null };
}
