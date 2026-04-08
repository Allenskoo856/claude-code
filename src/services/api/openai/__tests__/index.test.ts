import { describe, expect, mock, test } from 'bun:test'
import type { ChatCompletionChunk } from 'openai/resources/chat/completions/completions.mjs'

const mockChunks: ChatCompletionChunk[] = []

function mockStream(chunks: ChatCompletionChunk[]): AsyncIterable<ChatCompletionChunk> {
  return {
    [Symbol.asyncIterator]() {
      let i = 0
      return {
        async next() {
          if (i >= chunks.length) return { done: true, value: undefined }
          return { done: false, value: chunks[i++] }
        },
      }
    },
  }
}

function makeChunk(overrides: Partial<ChatCompletionChunk> & any = {}): ChatCompletionChunk {
  return {
    id: 'chatcmpl-test',
    object: 'chat.completion.chunk',
    created: 1234567890,
    model: 'gpt-4o',
    choices: [],
    ...overrides,
  } as ChatCompletionChunk
}

mock.module('../client.js', () => ({
  getOpenAIClient: () => ({
    chat: {
      completions: {
        create: async () => mockStream(mockChunks),
      },
    },
  }),
}))

mock.module('../convertMessages.js', () => ({
  anthropicMessagesToOpenAI: () => [],
}))

mock.module('../convertTools.js', () => ({
  anthropicToolsToOpenAI: () => [],
  anthropicToolChoiceToOpenAI: () => undefined,
}))

mock.module('../modelMapping.js', () => ({
  resolveOpenAIModel: () => 'gpt-4o',
}))

const { queryModelOpenAI } = await import('../index.js')

describe('queryModelOpenAI usage write-back', () => {
  test('writes final usage and stop_reason to emitted assistant message', async () => {
    mockChunks.length = 0

    mockChunks.push(
      makeChunk({
        choices: [{ index: 0, delta: { content: 'hello' }, finish_reason: null }],
      }),
      makeChunk({
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        usage: {
          prompt_tokens: 120,
          completion_tokens: 30,
          total_tokens: 150,
          prompt_tokens_details: { cached_tokens: 50 },
        } as any,
      }),
    )

    const out: any[] = []
    for await (const item of queryModelOpenAI(
      [],
      [] as any,
      [],
      new AbortController().signal,
      {
        model: 'claude-sonnet-4-6',
        querySource: 'test',
        getToolPermissionContext: async () => ({}),
      } as any,
    )) {
      out.push(item)
    }

    const assistant = out.find(m => m?.type === 'assistant')
    expect(assistant).toBeDefined()
    expect(assistant.message.usage.input_tokens).toBe(120)
    expect(assistant.message.usage.output_tokens).toBe(30)
    expect(assistant.message.usage.cache_read_input_tokens).toBe(50)
    expect(assistant.message.stop_reason).toBe('end_turn')
  })
})
