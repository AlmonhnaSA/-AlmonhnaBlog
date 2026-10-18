/** Provider-neutral cleanup. A committed DB tombstone fences every attachment.
 * Never restore ready after an uncertain provider result: retry the same token. */
export interface DeletionClaim {
  asset_id: string; token: string; provider: string; bucket: string; object_key: string;
}
export interface MediaStorageProvider {
  removeAndVerify(claim: DeletionClaim): Promise<void>;
}
export interface CleanupRepository {
  claim(receipt: string): Promise<DeletionClaim | null>;
  finish(claim: DeletionClaim): Promise<void>;
  failure(claim: DeletionClaim): Promise<void>;
}
// A separate, approved source release is required. No env/client switch enables deletion.
export const PHYSICAL_DELETE_ENABLED = false;
export async function drainMediaCleanup(
  receipt: string, repository: CleanupRepository,
  providers: Record<string, MediaStorageProvider>, enabled = PHYSICAL_DELETE_ENABLED,
): Promise<{ deleted: number; pending: boolean; disabled: boolean }> {
  if (!enabled) return { deleted: 0, pending: true, disabled: true };
  let deleted = 0;
  for (let i = 0; i < 20; i++) {
    const claim = await repository.claim(receipt);
    if (!claim) return { deleted, pending: false, disabled: false };
    try {
      const provider = providers[claim.provider];
      if (!provider) throw new Error("unsupported_provider");
      await provider.removeAndVerify(claim);
      await repository.finish(claim);
      deleted++;
    } catch {
      await repository.failure(claim);
      return { deleted, pending: true, disabled: false };
    }
  }
  return { deleted, pending: true, disabled: false };
}