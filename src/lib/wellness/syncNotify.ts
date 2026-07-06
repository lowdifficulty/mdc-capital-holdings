let scheduleFn: (() => void) | null = null;

export function registerWellnessSyncScheduler(fn: () => void): void {
  scheduleFn = fn;
}

export function markWellnessDirty(): void {
  scheduleFn?.();
}
