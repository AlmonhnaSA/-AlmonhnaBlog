import { test, expect } from "bun:test";
import { mosaicLayout } from "../src/components/home/CategoryMosaic";

const cover = (total: number, perRow: number) => {
  const l = mosaicLayout(total, perRow);
  const grid = Array.from({ length: l.rows }, () => Array(l.columns).fill(0));
  for (let i = 0; i < total; i++) {
    const p = l.place(i);
    const [c1, c2] = p.gridColumn.split(" / ").map(Number);
    const [r1, r2] = p.gridRow.split(" / ").map(Number);
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) grid[r - 1][c - 1]++;
  }
  return grid.flat();
};

test("every category count fills the mosaic without gaps or overlaps", () => {
  for (const perRow of [1, 2]) for (let n = 1; n <= 30; n++) expect(cover(n, perRow).every((v) => v === 1)).toBe(true);
});
