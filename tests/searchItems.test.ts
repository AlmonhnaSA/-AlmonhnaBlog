import { expect, test } from "bun:test";
import { searchItems } from "../src/lib/searchItems";
const items = [{ id: "1", title: "الاقتصادُ السعودي", profiles: { name: "أحمد" } }, { id: "2", title: "السوق", profiles: { name: "سارة" } }];
test("matches ignoring diacritics and nested fields", () => {
  expect(searchItems(items, "الاقتصاد").map((i) => i.id)).toEqual(["1"]);
  expect(searchItems(items, "احمد").map((i) => i.id)).toEqual(["1"]);
  expect(searchItems(items, "").length).toBe(2);
  expect(searchItems(items, "غير موجود").length).toBe(0);
});
