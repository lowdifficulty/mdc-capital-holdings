export function getQuiverApiKey(): string | null {
  return (
    process.env.QUIVER_API_KEY?.trim() ||
    process.env.QUIVER_API_TOKEN?.trim() ||
    null
  );
}
