export function normalizePostalCode(value: string): string | null {
  const trimmed = value.trim();
  return /^(?:\d{8}|\d{5}-\d{3})$/.test(trimmed) ? trimmed.replace('-', '') : null;
}

export function formatPostalCode(value: string): string {
  const normalized = normalizePostalCode(value);
  return normalized ? `${normalized.slice(0, 5)}-${normalized.slice(5)}` : value;
}
