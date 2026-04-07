import { type ExportResult, ExportResultCode } from '@opentelemetry/core'
import type {
  LogRecordExporter,
  ReadableLogRecord,
} from '@opentelemetry/sdk-logs'

export class FirstPartyEventLoggingExporter implements LogRecordExporter {
  constructor(
    _options: {
      timeout?: number
      maxBatchSize?: number
      skipAuth?: boolean
      batchDelayMs?: number
      baseBackoffDelayMs?: number
      maxBackoffDelayMs?: number
      maxAttempts?: number
      path?: string
      baseUrl?: string
      isKilled?: () => boolean
      schedule?: (fn: () => Promise<void>, delayMs: number) => () => void
    } = {},
  ) {}

  async getQueuedEventCount(): Promise<number> {
    return 0
  }

  async export(
    _logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void,
  ): Promise<void> {
    resultCallback({ code: ExportResultCode.SUCCESS })
  }

  async shutdown(): Promise<void> {}

  async forceFlush(): Promise<void> {}
}
