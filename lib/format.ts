const DATE_TIME_ZONE = "Asia/Manila";

const defaultDateFormat: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

export function formatDate(
  value: string | number | Date,
  opts?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "\u2014";
  }

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: DATE_TIME_ZONE,
    ...defaultDateFormat,
    ...opts,
  }).format(date);
}

export function formatDateTime(value: string | number | Date): string {
  return formatDate(value, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

export function formatIdentifier(value: string): string {
  return value.toUpperCase();
}

export interface PersonName {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
}

export function formatName({
  first_name,
  middle_name,
  last_name,
  suffix,
}: PersonName): string {
  const givenNames = [first_name, middle_name, suffix]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");

  return givenNames ? `${last_name}, ${givenNames}` : last_name;
}
