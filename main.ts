/* Vice Cover Studio — entrypoint (make.fun program/v1).
 *
 * When the grader runs this file it hands the entry in: it copies app/ and
 * screenshots/ from this repository into the output directory and writes
 * dossier.json there with buildDossier from vendor/makefun-app.ts. Outside
 * the grader, MAKEFUN_OUTPUT_DIR stands in for /output, so a local check is:
 *
 *   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
 *
 * Node 22 runs this TypeScript as-is: standard library only, no install,
 * no build step, no network. The program runs twice and both runs must
 * write the same bytes, so nothing here depends on the time or the machine.
 */

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

/** The caps the bounty gives buildDossier (see the kit's RULES.txt). */
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
} as const;

/** Where the entry goes: the grader's /output, or MAKEFUN_OUTPUT_DIR. */
function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv !== undefined && fromEnv !== '') return fromEnv;
  return '/output';
}

/** The repository root: the directory this file lives in. */
function repoRoot(): string {
  return dirname(fileURLToPath(import.meta.url));
}

/** Replace a directory in the output with a fresh copy from the repository. */
function replaceDir(source: string, target: string): void {
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
}

/** Hand the entry in: copy the app and its screenshots, write the dossier. */
function handIn(): void {
  const root = repoRoot();
  const out = outputDir();
  const appDir = join(root, 'app');
  const shotsDir = join(root, 'screenshots');
  if (!existsSync(appDir)) throw new Error(`main.ts: no app/ directory beside main.ts (${appDir})`);
  if (!existsSync(shotsDir)) throw new Error(`main.ts: no screenshots/ directory beside main.ts (${shotsDir})`);
  mkdirSync(out, { recursive: true });
  replaceDir(appDir, join(out, 'app'));
  replaceDir(shotsDir, join(out, 'screenshots'));
  const dossier = buildDossier(out, DOSSIER_CAPS);
  writeFileSync(join(out, 'dossier.json'), dossier);
  console.log(`vice-cover-studio: app/ + screenshots/ copied to ${out}`);
  console.log(`vice-cover-studio: dossier.json written (${dossier.length} bytes)`);
}

handIn();
