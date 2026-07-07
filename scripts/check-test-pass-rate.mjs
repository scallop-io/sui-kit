#!/usr/bin/env node
/**
 * Pre-push test gate.
 *
 * Runs the unit test suite and blocks the push unless the pass rate meets a
 * configurable threshold. Also (by default) blocks when any test is skipped or
 * uses `.only`, because a stray `.only` silently skips sibling tests — which is
 * how a broken release slipped through before (see suiInteractor.spec.ts).
 *
 * Env vars:
 *   MIN_PASS_RATE   Minimum pass rate as a percent. Default: 100.
 *   ALLOW_SKIPPED   Set to "1"/"true" to permit skipped/.only tests. Default: off.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the repo-local vitest binary. Husky hooks (and a bare `node`
// invocation) do not have node_modules/.bin on PATH the way `pnpm run` does,
// so relying on PATH resolution silently fails with ENOENT.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const localVitest = join(
	repoRoot,
	"node_modules",
	".bin",
	isWin ? "vitest.CMD" : "vitest",
);
const vitestBin = existsSync(localVitest) ? localVitest : "vitest";

const MIN_PASS_RATE = Number(process.env.MIN_PASS_RATE ?? "100");
const ALLOW_SKIPPED = /^(1|true)$/i.test(process.env.ALLOW_SKIPPED ?? "");

if (Number.isNaN(MIN_PASS_RATE) || MIN_PASS_RATE < 0 || MIN_PASS_RATE > 100) {
	console.error(
		`✖ Invalid MIN_PASS_RATE: "${process.env.MIN_PASS_RATE}" (expected 0–100)`,
	);
	process.exit(2);
}

const dir = mkdtempSync(join(tmpdir(), "suikit-test-gate-"));
const outputFile = join(dir, "results.json");

console.log(
	`▶ Running unit tests (gate: ≥${MIN_PASS_RATE}% pass${ALLOW_SKIPPED ? "" : ", no skipped/.only"})…`,
);

// Note: vitest exits non-zero when tests fail; we still parse the JSON to report
// the exact pass rate rather than relying solely on the exit code.
const run = spawnSync(
	vitestBin,
	[
		"run",
		"test/unit",
		"--test-timeout=60000",
		"--reporter=default",
		"--reporter=json",
		`--outputFile=${outputFile}`,
	],
	{ stdio: "inherit", shell: false, cwd: repoRoot },
);

if (run.error) {
	console.error(`✖ Failed to launch vitest (${vitestBin}): ${run.error.message}`);
	rmSync(dir, { recursive: true, force: true });
	process.exit(1);
}

let report;
try {
	report = JSON.parse(readFileSync(outputFile, "utf8"));
} catch {
	console.error("✖ Could not read vitest JSON output — assuming failure.");
	rmSync(dir, { recursive: true, force: true });
	process.exit(run.status || 1);
}
rmSync(dir, { recursive: true, force: true });

const total = report.numTotalTests ?? 0;
const passed = report.numPassedTests ?? 0;
const failed = report.numFailedTests ?? 0;
const skipped = (report.numPendingTests ?? 0) + (report.numTodoTests ?? 0);

// Rate is computed over tests that actually ran; skipped tests are surfaced
// separately so they can never be "passed over" silently.
const ran = passed + failed;
const rate = ran === 0 ? 0 : (passed / ran) * 100;

console.log("");
console.log(`  total:   ${total}`);
console.log(`  passed:  ${passed}`);
console.log(`  failed:  ${failed}`);
console.log(`  skipped: ${skipped}`);
console.log(`  pass rate (of tests run): ${rate.toFixed(2)}%`);
console.log("");

let ok = true;

if (ran === 0) {
	console.error("✖ No tests ran — refusing to push.");
	ok = false;
}

if (rate < MIN_PASS_RATE) {
	console.error(
		`✖ Pass rate ${rate.toFixed(2)}% is below the required ${MIN_PASS_RATE}%.`,
	);
	ok = false;
}

if (skipped > 0 && !ALLOW_SKIPPED) {
	console.error(
		`✖ ${skipped} test(s) skipped. A stray \`.only\` or \`.skip\` hides real coverage.\n` +
			"  Remove it, or set ALLOW_SKIPPED=1 to bypass this check.",
	);
	ok = false;
}

if (!ok) {
	console.error("\n✖ Push blocked by test gate.");
	process.exit(1);
}

console.log("✔ Test gate passed.");
