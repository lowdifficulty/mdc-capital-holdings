let scheduleFn: (() => void) | null = null;
let flushFn: (() => void) | null = null;

export function registerWellnessSyncScheduler(schedule: () => void, flush: () => void): void {
  scheduleFn = schedule;
  flushFn = flush;
}

/** Debounced sync — checkoffs, typing, reordering. */
export function markWellnessDirty(): void {
  scheduleFn?.();
}

/** Immediate sync — explicit saves (body metrics, locked notes). */
export function markWellnessSaved(): void {
  flushFn?.();
}
