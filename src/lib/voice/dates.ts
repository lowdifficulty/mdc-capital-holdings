const DASHBOARD_TIMEZONE = process.env.DASHBOARD_TIMEZONE || "America/Los_Angeles";

export function dashboardTodayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: DASHBOARD_TIMEZONE }).format(new Date());
}

export function resolveDateIso(value: unknown): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return dashboardTodayIso();
}
