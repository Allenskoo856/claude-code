export type PluginFetchSource =
  | 'install_counts'
  | 'marketplace_clone'
  | 'marketplace_pull'
  | 'marketplace_url'
  | 'plugin_clone'
  | 'mcpb'

export type PluginFetchOutcome = 'success' | 'failure' | 'cache_hit'

export function logPluginFetch(
  _source: PluginFetchSource,
  _urlOrSpec: string | undefined,
  _outcome: PluginFetchOutcome,
  _durationMs: number,
  _errorKind?: string,
): void {}

export function classifyFetchError(_error: unknown): string {
  return 'other'
}
