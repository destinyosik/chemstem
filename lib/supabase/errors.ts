export function isMissingSupabaseRpc(error: { code?: string }): boolean {
  return error.code === "PGRST202";
}
