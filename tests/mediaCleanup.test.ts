import { expect, test } from "bun:test";
import { drainMediaCleanup, PHYSICAL_DELETE_ENABLED, type DeletionClaim } from "../supabase/functions/_shared/mediaCleanup";
const claim: DeletionClaim = { asset_id: "asset", token: "fence", provider: "supabase", bucket: "images", object_key: "user/old.png" };
function fixture() {
  const events: string[] = []; let offered = false;
  return { events, repo: {
    async claim(receipt: string) { events.push(`claim:${receipt}`); if (offered) return null; offered=true; return claim; },
    async finish(c: DeletionClaim) { events.push(`finish:${c.token}`); },
    async failure(c: DeletionClaim) { events.push(`retry:${c.token}`); },
  } };
}
test("production deletion disabled cannot call provider or claim", async () => {
  const f=fixture(); expect(PHYSICAL_DELETE_ENABLED).toBe(false);
  const r=await drainMediaCleanup("verified",f.repo,{supabase:{async removeAndVerify(){throw Error("must not run");}}});
  expect(f.events).toEqual([]); expect(r.disabled).toBe(true);
});
test("verified save receipt claims before bytes deletion then confirms",async()=>{
  const f=fixture(); await drainMediaCleanup("verified",f.repo,{supabase:{async removeAndVerify(c){f.events.push(`delete:${c.token}`);}}},true);
  expect(f.events).toEqual(["claim:verified","delete:fence","finish:fence","claim:verified"]);
});
test("timeout retains fenced claim for retry and does not report deletion",async()=>{
  const f=fixture(); const r=await drainMediaCleanup("verified",f.repo,{supabase:{async removeAndVerify(){throw Error("timeout");}}},true);
  expect(f.events).toEqual(["claim:verified","retry:fence"]);expect(r.deleted).toBe(0);expect(r.pending).toBe(true);
});
test("missing future provider cannot fall back to deleting another bucket",async()=>{
  const f=fixture();await drainMediaCleanup("verified",f.repo,{},true);expect(f.events).toEqual(["claim:verified","retry:fence"]);
});
test("shared image denied by repository never reaches provider",async()=>{
  let called=false;const r=await drainMediaCleanup("shared",{async claim(){return null;},async finish(){},async failure(){}},{supabase:{async removeAndVerify(){called=true;}}},true);
  expect(called).toBe(false);expect(r.deleted).toBe(0);
});