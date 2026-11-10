export type DataError = { code: string; message: string };

export type DataResult<T> =
  | { data: T; error: null }
  | { data: null; error: DataError };

export type PagedResult<T> = DataResult<{
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}>;

const PG_ERROR_MESSAGES: Record<string, string> = {
  "23505": "A record with this identifier already exists.",
  "23503":
    "This record cannot be removed because related records depend on it.",
  "23502": "A required field is missing.",
  "42501": "You do not have permission to perform this action.",
  "23514":
    "The provided information does not meet the required validation rules.",
  "22P02": "The provided identifier is not valid.",
};

const GENERIC_ERROR_MESSAGE =
  "Something went wrong while processing your request. Please try again.";

export const pgErrorMessage = (code: string): string =>
  PG_ERROR_MESSAGES[code] ?? GENERIC_ERROR_MESSAGE;
