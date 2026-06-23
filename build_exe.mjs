import { execSync } from "child_process";
import { copyFileSync, unlinkSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const DIR = resolve(import.meta.dirname);
const SCRIPT = resolve(DIR, "vistoriar_arvore.cjs");
const EXE = resolve(DIR, "vistoriar_arvore.exe");
const CONFIG = resolve(DIR, "sea-config.json");
const BLOB = resolve(DIR, "sea-prep.blob");
const NODE = process.execPath;

try {
  process.stdout.write("\n=== Criando executavel standalone ===\n\n");

  process.stdout.write("[1/4] Criando config SEA...\n");
  writeFileSync(CONFIG, JSON.stringify({
    main: SCRIPT,
    output: BLOB,
    disableExperimentalSEAWarning: true,
  }, null, 2));

  process.stdout.write("[2/4] Gerando blob SEA...\n");
  execSync(`node --experimental-sea-config "${CONFIG}"`, { cwd: DIR, stdio: "pipe" });

  process.stdout.write("[3/4] Copiando Node.js runtime...\n");
  if (existsSync(EXE)) unlinkSync(EXE);
  copyFileSync(NODE, EXE);

  process.stdout.write("[4/4] Injetando script no executavel...\n");
  const postjectCmd = `npx postject "${EXE}" NODE_SEA_BLOB "${BLOB}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`;
  try {
    execSync(postjectCmd, { cwd: DIR, stdio: "pipe" });
  } catch {
    process.stdout.write("  Instalando postject...\n");
    execSync("npm install -g postject", { cwd: DIR, stdio: "pipe" });
    execSync(postjectCmd, { cwd: DIR, stdio: "pipe" });
  }

  process.stdout.write("\n=== EXECUTAVEL CRIADO ===\n");
  process.stdout.write(`  ${EXE}\n`);
  process.stdout.write("\n  Teste arrastando uma foto sobre ele!\n");
} catch (err) {
  process.stderr.write(`\nErro: ${err.message}\n`);
  process.stdout.write("\nAlternativa: use o vistoriar_arvore.bat (arraste a foto)\n");
  process.exit(1);
} finally {
  for (const f of [CONFIG, BLOB]) {
    if (existsSync(f)) unlinkSync(f);
  }
}
