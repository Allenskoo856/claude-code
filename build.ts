import { readdir, readFile, writeFile, cp, chmod } from 'fs/promises'
import { join } from 'path'
import { getMacroDefines } from './scripts/defines.ts'

const outdir = 'dist'

// Step 1: Clean output directory
const { rmSync } = await import('fs')
rmSync(outdir, { recursive: true, force: true })

// Default features that match the official CLI build.
// Additional features can be enabled via FEATURE_<NAME>=1 env vars.
const DEFAULT_BUILD_FEATURES = [
  'BUDDY',
  'TRANSCRIPT_CLASSIFIER',
  'BRIDGE_MODE',
  'AGENT_TRIGGERS_REMOTE',
  'CHICAGO_MCP',
  'VOICE_MODE',
  'SHOT_STATS',
  'PROMPT_CACHE_BREAK_DETECTION',
  'TOKEN_BUDGET',
  // P0: local features
  'AGENT_TRIGGERS',
  'ULTRATHINK',
  'BUILTIN_EXPLORE_PLAN_AGENTS',
  'LODESTONE',
  // P1: API-dependent features
  'EXTRACT_MEMORIES',
  'VERIFICATION_AGENT',
  'KAIROS_BRIEF',
  'AWAY_SUMMARY',
  'ULTRAPLAN',
  // P2: daemon + remote control server
  'DAEMON',
]

// Collect FEATURE_* env vars → Bun.build features
const envFeatures = Object.keys(process.env)
  .filter(k => k.startsWith('FEATURE_'))
  .map(k => k.replace('FEATURE_', ''))
const features = [...new Set([...DEFAULT_BUILD_FEATURES, ...envFeatures])]

// Step 2: Bundle with splitting
const result = await Bun.build({
  entrypoints: ['src/entrypoints/cli.tsx'],
  outdir,
  target: 'node',
  splitting: true,
  define: getMacroDefines(),
  features,
})

if (!result.success) {
  console.error('Build failed:')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

// Step 3: Post-process — replace Bun-only `import.meta.require` with Node.js compatible version
const files = await readdir(outdir)
const IMPORT_META_REQUIRE = 'var __require = import.meta.require;'
const COMPAT_REQUIRE = `var __require = typeof import.meta.require === "function" ? import.meta.require : (await import("module")).createRequire(import.meta.url);`
const BUN_SHEBANG = '#!/usr/bin/env bun'
const NODE_SHEBANG = '#!/usr/bin/env node'

let patched = 0
for (const file of files) {
  if (!file.endsWith('.js')) continue
  const filePath = join(outdir, file)
  let content = await readFile(filePath, 'utf-8')
  let changed = false

  if (content.startsWith(BUN_SHEBANG)) {
    content = NODE_SHEBANG + content.slice(BUN_SHEBANG.length)
    changed = true
  }
  if (content.includes('\n// @bun\n')) {
    content = content.replace('\n// @bun\n', '\n')
    changed = true
  }
  if (content.includes(IMPORT_META_REQUIRE)) {
    content = content.replace(IMPORT_META_REQUIRE, COMPAT_REQUIRE)
    changed = true
  }
  if (changed) {
    await writeFile(filePath, content)
    patched++
  }
}

// Ensure CLI entry is executable after shebang rewrite
await chmod(join(outdir, 'cli.js'), 0o755)

console.log(
  `Bundled ${result.outputs.length} files to ${outdir}/ (patched ${patched} for Node.js compat)`,
)

// Step 4: Copy native .node addon files (audio-capture)
const vendorDir = join(outdir, 'vendor', 'audio-capture')
await cp('vendor/audio-capture', vendorDir, { recursive: true })
console.log(`Copied vendor/audio-capture/ → ${vendorDir}/`)

// Step 5: Bundle download-ripgrep script as standalone JS for postinstall
const rgScript = await Bun.build({
  entrypoints: ['scripts/download-ripgrep.ts'],
  outdir,
  target: 'node',
})
if (!rgScript.success) {
  console.error('Failed to bundle download-ripgrep script:')
  for (const log of rgScript.logs) {
    console.error(log)
  }
  // Non-fatal — postinstall fallback to bun run scripts/download-ripgrep.ts
} else {
  console.log(`Bundled download-ripgrep script to ${outdir}/`)
}
