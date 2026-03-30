const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function isEnabled(rawValue: string | undefined): boolean {
  if (!rawValue) return false;
  return TRUE_VALUES.has(rawValue.trim().toLowerCase());
}

export function isEcomForecastEnabled(): boolean {
  return (
    isEnabled(process.env.FEATURE_ECOM_FORECAST) ||
    isEnabled(process.env.NEXT_PUBLIC_FEATURE_ECOM_FORECAST)
  );
}
