import { join } from 'path'
import { type ReleaseChannel } from './config.js'
import { getClaudeConfigHomeDir } from './envUtils.js'

export type InstallStatus =
  | 'success'
  | 'no_permissions'
  | 'install_failed'
  | 'in_progress'

export type AutoUpdaterResult = {
  version: string | null
  status: InstallStatus
  notifications?: string[]
}

export type MaxVersionConfig = {
  external?: string
  ant?: string
  external_message?: string
  ant_message?: string
}

export async function assertMinVersion(): Promise<void> {}

export async function getMaxVersion(): Promise<string | undefined> {
  return undefined
}

export async function getMaxVersionMessage(): Promise<string | undefined> {
  return undefined
}

export function shouldSkipVersion(_targetVersion: string): boolean {
  return false
}

export function getLockFilePath(): string {
  return join(getClaudeConfigHomeDir(), '.update.lock')
}

export async function checkGlobalInstallPermissions(): Promise<{
  hasPermissions: boolean
  npmPrefix: string | null
}> {
  return { hasPermissions: false, npmPrefix: null }
}

export async function getLatestVersion(
  _channel: ReleaseChannel,
): Promise<string | null> {
  return null
}

export type NpmDistTags = {
  latest: string | null
  stable: string | null
}

export async function getNpmDistTags(): Promise<NpmDistTags> {
  return { latest: null, stable: null }
}

export async function getLatestVersionFromGcs(
  _channel: ReleaseChannel,
): Promise<string | null> {
  return null
}

export async function getGcsDistTags(): Promise<NpmDistTags> {
  return { latest: null, stable: null }
}

export async function getVersionHistory(_limit: number): Promise<string[]> {
  return []
}

export async function installGlobalPackage(
  _specificVersion?: string | null,
): Promise<InstallStatus> {
  return 'install_failed'
}
