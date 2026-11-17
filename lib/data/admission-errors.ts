import { pgErrorMessage } from "./result";

/**
 * Maps admission/transfer/discharge RPC errors to safe user-facing messages.
 * The RPCs raise specific messages; avoid exposing raw database details.
 */
export function admissionErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("bed is not available")) {
    return "The selected bed is no longer available.";
  }

  if (message.includes("bed does not belong")) {
    return "The selected bed does not belong to the chosen department.";
  }

  if (message.includes("active bed assignment")) {
    return "The patient has no active bed assignment.";
  }

  if (message.includes("already in the selected bed")) {
    return "The patient is already in that bed.";
  }

  if (message.includes("only admitted patients")) {
    return "Only admitted patients can be processed.";
  }

  if (message.includes("active patient")) {
    return "The selected patient is not active.";
  }

  if (message.includes("physician not found")) {
    return "The selected physician was not found.";
  }

  if (message.includes("admission not found")) {
    return "The selected admission was not found.";
  }

  if (message.includes("bed not found")) {
    return "The selected bed was not found.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}
