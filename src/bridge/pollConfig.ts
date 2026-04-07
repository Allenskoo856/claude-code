import {
  DEFAULT_POLL_CONFIG,
  type PollIntervalConfig,
} from './pollConfigDefaults.js'

export function getPollIntervalConfig(): PollIntervalConfig {
  return DEFAULT_POLL_CONFIG
}
