import { expect, test } from "bun:test";
import { cloudImageProvider } from "../supabase/functions/media-lifecycle/storageProvider";
const claim={asset_id:"asset",token:"token",provider:"supabase",bucket:"images",object_key:"user/old.png"};
function client(status:string,data:unknown=null,removeError:unknown=null) {
  const calls:string[]=[];
  const mock={storage:{from(bucket:string){calls.push(bucket);return{
    async remove(keys:string[]){calls.push(keys.join(","));return{error:removeError};},
    async info(){return{data,error:{statusCode:status,message:"Object not found"}};},
    async list(){return{data:[],error:null};},
  };}}};
  return {calls,provider:cloudImageProvider(mock as unknown as Parameters<typeof cloudImageProvider>[0])};
}
test("provider verifies 404 absence after removing exact claimed key",async()=>{
  const f=client("404");await f.provider.removeAndVerify(claim);expect(f.calls).toEqual(["images","user/old.png"]);
});
test("permission or network error is never absence proof",async()=>{
  const f=client("403");await expect(f.provider.removeAndVerify(claim)).rejects.toThrow("absence_unconfirmed");
});
test("object still present cannot be recorded deleted",async()=>{
  const f=client("404",{size:12});await expect(f.provider.removeAndVerify(claim)).rejects.toThrow("absence_unconfirmed");
});
test("audio bucket is not handled by image provider",async()=>{
  const f=client("404");await expect(f.provider.removeAndVerify({...claim,bucket:"audio"})).rejects.toThrow("bucket_not_allowed");expect(f.calls).toEqual([]);
});