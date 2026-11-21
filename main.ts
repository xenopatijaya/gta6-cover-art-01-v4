// main.ts — Vice Key Art Studio · make.fun entrypoint.
// Copies the static app and the screenshots into the output directory and
// writes the dossier produced by the kit library. Node 22 standard
// library only, no network, deterministic: the same repo always produces
// byte-identical output.

import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-ignore — kit library shipped with the starter, plain ESM.
import { buildDossier } from "./vendor/makefun-app.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

const MAX_DOSSIER_BYTES = Math.floor(1.5 * 1024 * 1024);

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  // Replace only our own payload directories — never the output dir
  // itself, which the grader owns.
  for (const name of ["app", "screenshots"]) {
    const dest = join(outputDir, name);
    await rm(dest, { recursive: true, force: true });
    await cp(join(repoRoot, name), dest, { recursive: true });
  }

  const dossier: unknown = await buildDossier(outputDir, caps);
  const bytes = typeof dossier === "string"
    ? new TextEncoder().encode(dossier)
    : dossier instanceof Uint8Array
      ? dossier
      : new TextEncoder().encode(JSON.stringify(dossier));

  if (bytes.byteLength > MAX_DOSSIER_BYTES) {
    throw new Error(
      `dossier.json is ${bytes.byteLength} bytes, over the 1.5 MiB limit`
    );
  }
  await writeFile(join(outputDir, "dossier.json"), bytes);

  const info = await stat(join(outputDir, "dossier.json"));
  console.log(`dossier.json written: ${info.size} bytes`);
}

await main();
