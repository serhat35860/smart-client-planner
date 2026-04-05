/** Ekleyen dışında (veya ekleyen yokken önceki kaydeden dışında) biri kaydetti mi — bir kez true kalır. */
export function nextEditedByOtherMember(
  existingFlag: boolean,
  createdByUserId: string | null,
  previousUpdatedByUserId: string | null,
  patchUserId: string
): boolean {
  if (existingFlag) return true;
  if (createdByUserId != null && patchUserId !== createdByUserId) return true;
  if (
    createdByUserId == null &&
    previousUpdatedByUserId != null &&
    patchUserId !== previousUpdatedByUserId
  ) {
    return true;
  }
  return false;
}
