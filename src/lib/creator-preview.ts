/** Sunucudan gelen «kim ekledi / güncelledi» özeti (not / görev / müşteri kartları). */
export type CreatorPreview = { id: string; name: string | null; email: string };

export const creatorSelect = { id: true, name: true, email: true } as const;

/** Not kartındaki #etiket satırı: etiket adı + etiketi oluşturan üye. */
export type TagWithCreator = { name: string; createdBy: CreatorPreview | null };

export function mapNoteTagsToDisplay(
  rows: { tag: { name: string; createdBy: CreatorPreview | null } }[]
): TagWithCreator[] {
  return rows.map((row) => ({ name: row.tag.name, createdBy: row.tag.createdBy }));
}

/** Not üzerinde etiketlenen ekip üyeleri (userId + görünen ad). */
export type NoteMentionMember = { userId: string; name: string | null; email: string };

export function mapNoteMentions(
  rows: { user: { id: string; name: string | null; email: string } }[]
): NoteMentionMember[] {
  return rows.map((row) => ({
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email
  }));
}

/** Görev `mentions` satırı — not ile aynı şekil. */
export const mapTaskMentions = mapNoteMentions;
