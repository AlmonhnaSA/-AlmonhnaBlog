import { collectReferences, decodeBounded, embeddedBytes, identityKey, isAudio, type MediaIdentity } from "../../supabase/functions/_shared/mediaReferences";

export interface StoredFile extends MediaIdentity { size: number; mime: string; modified: string }
export interface ScanInput { project: string; files: StoredFile[]; sources: { location: string; value: unknown }[]; errors: string[]; protectedKeys: string[]; externalReviewed: boolean }
export function buildInventory(input: ScanInput) {
  const references = input.sources.flatMap(s => collectReferences(s.value, input.project, s.location));
  const byIdentity = new Map<string, typeof references>();
  for (const ref of references) {
    const key = identityKey(ref.identity);
    byIdentity.set(key, [...(byIdentity.get(key) || []), ref]);
  }
  const complete = input.errors.length === 0;
  const files = input.files.map(file => {
    const key = identityKey(file);
    const refs = byIdentity.get(key) || [];
    const possible = input.sources.filter(s => {
      const text = decodeBounded(typeof s.value === "string" ? s.value : JSON.stringify(s.value));
      return text.includes(file.key) && !refs.some(r => r.location.startsWith(s.location));
    }).map(s => s.location);
    const protectedFile = isAudio(file.key, file.mime) || input.protectedKeys.includes(key);
    const classification = protectedFile ? "protected" : refs.length ? "used" : possible.length ? "possible_reference" : !complete ? "unknown" : "candidate";
    return { ...file, classification, confidence: refs.length ? "exact" : possible.length || !complete ? "low" : "candidate_only", reasons: protectedFile ? ["protected_or_audio"] : refs.length ? ["reference_found"] : possible.length ? ["path_or_ambiguous_reference"] : !complete ? ["incomplete_scan"] : ["no_reference_in_scanned_sources", ...(input.externalReviewed ? [] : ["external_use_unreviewed"])], references: refs.map(r => r.location), possibleReferences: possible, safeToDelete: false };
  });
  return { version: 1, project: input.project, scannedAt: new Date().toISOString(), complete, errors: input.errors, externalReviewed: input.externalReviewed, files, summary: { count: files.length, bytes: files.reduce((n, f) => n + f.size, 0), candidateBytes: files.filter(f => f.classification === "candidate").reduce((n, f) => n + f.size, 0), safeDeleteBytes: 0, embeddedImageBytes: input.sources.reduce((n, s) => n + embeddedBytes(s.value), 0) } };
}
export function csvInventory(report: ReturnType<typeof buildInventory>): string {
  const cells = (v: unknown) => `"${String(v).replace(/"/g, '""').replace(/^[=+@-]/, "'$&")}"`;
  return ["project,bucket,key,size,classification,confidence,reasons,references", ...report.files.map(f => [f.project, f.bucket, f.key, f.size, f.classification, f.confidence, f.reasons.join(";"), [...f.references, ...f.possibleReferences].join(";")].map(cells).join(","))].join("\n");
}