export async function uploadUserSettingsInBackground(): Promise<void> {}

export function _resetDownloadPromiseForTesting(): void {}

export function downloadUserSettings(): Promise<boolean> {
  return Promise.resolve(false)
}

export function redownloadUserSettings(): Promise<boolean> {
  return Promise.resolve(false)
}
