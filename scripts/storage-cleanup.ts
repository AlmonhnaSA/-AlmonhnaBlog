/** Deliberately no storage-delete client. Only the fenced server may delete. */
import { readFile } from "node:fs/promises";
const input = process.argv[2];
if (!input) throw new Error("Pass an inventory report. This command is preview-only until a separate approval and server activation.");
const report = JSON.parse(await readFile(input, "utf8"));
if (report.version !== 1 || report.project !== process.env.MEDIA_EXPECTED_PROJECT || !report.complete) throw new Error("Incomplete, incompatible or wrong-project report.");
if (process.argv.includes("--execute")) throw new Error("Execution is intentionally disabled. Old files need backup, a fresh independent scan, approved keys and a fenced server deployment under separate approval.");
console.log(JSON.stringify({ dryRun: true, count: report.files.filter((f: { classification: string }) => f.classification === "candidate").length, possibleBytes: report.summary.candidateBytes, safeDeleteBytes: 0, reason: "Candidates are not proven safe; no files deleted." }));