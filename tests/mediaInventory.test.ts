import { expect, test } from "bun:test";
import { buildInventory, csvInventory } from "../scripts/media/inventory";
const project = "abcdefghijklmnopqrst";
const file = { project, bucket: "images", key: "user/a.png", size: 1024, mime: "image/png", modified: "2026-10-18" };
test("unmatched files remain candidates, never safe deletion", () => {
  const report = buildInventory({ project, files: [file], sources: [], errors: [], protectedKeys: [], externalReviewed: false });
  expect(report.files[0].classification).toBe("candidate");
  expect(report.files[0].safeToDelete).toBe(false);
  expect(report.summary.candidateBytes).toBe(1024);
  expect(report.summary.safeDeleteBytes).toBe(0);
});
test("unreadable source makes inventory incomplete", () => {
  const report = buildInventory({ project, files: [file], sources: [], errors: ["table_unreadable"], protectedKeys: [], externalReviewed: true });
  expect(report.complete).toBe(false);
  expect(report.files[0].classification).toBe("unknown");
  expect(report.summary.candidateBytes).toBe(0);
});
test("bare paths and foreign-host aliases are conservatively protected", () => {
  const report = buildInventory({ project, files: [file], sources: [{ location: "static", value: "/images/user/a.png" }], errors: [], protectedKeys: [], externalReviewed: false });
  expect(report.files[0].classification).toBe("possible_reference");
});
test("audio and explicit external consumers stay protected", () => {
  const report = buildInventory({ project, files: [file, { ...file, key: "audio/a.mp3" }], sources: [], errors: [], protectedKeys: [`${project}/images/user/a.png`], externalReviewed: true });
  expect(report.files.map(f => f.classification)).toEqual(["protected", "protected"]);
  expect(csvInventory(report)).toContain("1024");
});