import { Alert } from "@/components/ui/alert";
import type { DataError } from "@/lib/data/result";

export interface ErrorStateProps {
  error: DataError;
  title?: string;
}

/**
 * Friendly error surface for a failed data read (THEME.MD §9.4).
 * Never renders raw SQL or internal identifiers.
 */
export function ErrorState({
  error,
  title = "We could not load this information",
}: ErrorStateProps) {
  return (
    <Alert variant="danger" title={title}>
      <p>{error.message}</p>
      <p className="mt-1 text-[11px] text-red-800/80">
        Check your connection and try again. If the problem continues, contact
        hospital system administration.
      </p>
    </Alert>
  );
}
