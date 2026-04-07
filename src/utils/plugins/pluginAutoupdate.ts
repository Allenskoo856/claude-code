export type PluginAutoUpdateCallback = (updatedPlugins: string[]) => void

export function onPluginsAutoUpdated(
  _callback: PluginAutoUpdateCallback,
): () => void {
  return () => {}
}

export function getAutoUpdatedPluginNames(): string[] {
  return []
}

export async function updatePluginsForMarketplaces(
  _marketplaceNames: Set<string>,
): Promise<string[]> {
  return []
}

export function autoUpdateMarketplacesAndPluginsInBackground(): void {}
