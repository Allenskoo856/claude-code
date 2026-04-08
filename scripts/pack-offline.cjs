#!/usr/bin/env node
/**
 * Build an offline-installable package tarball.
 *
 * Output:
 *   offline-dist/<name>-<version>-offline.tgz
 *
 * This package includes:
 * - dist/
 * - node_modules/
 * - scripts/postinstall.cjs
 * - a trimmed package.json
 */

const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
)

const offlineRoot = path.join(root, 'offline-dist')
const stageRoot = path.join(offlineRoot, 'stage')
const stagePkgDir = path.join(stageRoot, 'package')
const tarName = `${pkg.name}-${pkg.version}-offline.tgz`
const tarPath = path.join(offlineRoot, tarName)

function assertExists(p) {
  if (!fs.existsSync(p)) {
    throw new Error(`Required path not found: ${p}`)
  }
}

async function main() {
  assertExists(path.join(root, 'dist'))
  assertExists(path.join(root, 'node_modules'))

  await fsp.rm(offlineRoot, { recursive: true, force: true })
  await fsp.mkdir(stagePkgDir, { recursive: true })

  await fsp.cp(path.join(root, 'dist'), path.join(stagePkgDir, 'dist'), {
    recursive: true,
  })

  // Ensure CLI is node-executable inside offline package.
  const stagedCli = path.join(stagePkgDir, 'dist', 'cli.js')
  if (fs.existsSync(stagedCli)) {
    let cli = fs.readFileSync(stagedCli, 'utf8')
    if (cli.startsWith('#!/usr/bin/env bun')) {
      cli = '#!/usr/bin/env node' + cli.slice('#!/usr/bin/env bun'.length)
    }
    cli = cli.replace('\n// @bun\n', '\n')
    fs.writeFileSync(stagedCli, cli, 'utf8')
    fs.chmodSync(stagedCli, 0o755)
  }
  await fsp.cp(
    path.join(root, 'scripts', 'postinstall.cjs'),
    path.join(stagePkgDir, 'scripts', 'postinstall.cjs'),
    { recursive: false },
  )
  await fsp.cp(
    path.join(root, 'node_modules'),
    path.join(stagePkgDir, 'node_modules'),
    { recursive: true },
  )

  const offlinePkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    type: 'module',
    bin: pkg.bin,
    engines: {
      node: '>=20.0.0',
    },
    scripts: {
      postinstall:
        'node -e "console.log(\'[offline] skip network postinstall steps\')"',
    },
  }

  await fsp.writeFile(
    path.join(stagePkgDir, 'package.json'),
    JSON.stringify(offlinePkg, null, 2) + '\n',
    'utf8',
  )

  const tarResult = spawnSync(
    'tar',
    ['-czf', tarPath, '-C', stageRoot, 'package'],
    {
      cwd: root,
      stdio: 'inherit',
    },
  )
  if (tarResult.status !== 0) {
    throw new Error(`tar failed with exit code ${tarResult.status}`)
  }

  console.log(`Offline package created: ${tarPath}`)
}

main().catch(err => {
  console.error(`[pack-offline] ${err.message}`)
  process.exit(1)
})
