# Yedek sonrası hatırlatma (sohbet dışı notlar)

Bu dosya, sohbet geçmişi silinse bile elinizde kalsın diye yazıldı. **Eski bir proje yedeğine dönerseniz bu dosya yedekte yoksa kaybolur** — dönmeden önce kopyalayın (ör. masaüstü).

## Masaüstü EXE (Windows)

- Kurulum yolu (tipik): `%LocalAppData%\Programs\Smart Client Planner\Smart Client Planner.exe`
- **Önemli düzeltme:** `electron/main.ts` içinde Next `standalone` sunucusu `fork` edilirken **`cwd`** mutlaka `server.js` dosyasının klasörü olmalı (`path.dirname(serverEntrypoint)`). Bu olmadan paketlenmiş uygulama sunucuyu kaldıramayıp hata/zaman aşımı verebilir.
- Eski EXE bu düzeltmeyi içermiyorsa: kaynak güncel + `npm run desktop:build` ile **yeniden paketleyip** kurun.
- `package.json` sürümü (installer): **1.0.2** (son bilinen hedef).
- Otomatik güncelleme: `package.json` → `build.publish` içinde `REPLACE_ME` gerçek GitHub `owner/repo` ile doldurulmalı; isteğe bağlı env: `DESKTOP_UPDATE_OWNER`, `DESKTOP_UPDATE_REPO`.

## Raporlar ve denetim

- `/api/reports`: müşteri/not/görev oluşturma-güncelleme, görev tamam/başarısız, etiket, `AuditEvent` satırları birleşik akış.
- `Client.updatedByUserId` (Prisma): müşteri güncellemesinde son kullanıcı; raporda “Kullanıcı” sütunu.
- Audit olay adları: `src/lib/audit-event-types.ts`; workspace işlemleri: `src/lib/workspace-audit.ts` (`logWorkspaceActivity`).
- Audit meta maskeleme: `src/lib/sanitize-audit-meta.ts` (`sanitizeAuditMetaForDisplay`).

## Test ve sürüm öncesi

- `npm run test` — Vitest (`src/lib/*.test.ts`).
- `npm run release:check` — **hafif:** `prisma validate`, `tsc`, `lint`, vitest; **içermez:** tam `next build` / `electron:build` (makine kilitlenmesin diye).
- Ağır adımlar ayrı: `npm run build`, sonra `npm run desktop:build`.
- CI: `.github/workflows/ci-security.yml` içinde build öncesi test adımı var.

## Veritabanı: `Note` modeli (notlar)

- Tanım: `prisma/schema.prisma` içinde `model Note { ... }` (workspace, client, içerik, hatırlatma alanları, `createdBy` / `updatedBy`).
- Veri dışa aktarma bu dosyada yok; yedek genelde tüm `*.db` veya proje klasörü ile alınır.

## Diğer

- `npm run check` = `lint` + `build` (test dahil değil).
- Prisma generate Windows’ta bazen EPERM (DLL kiliti): tüm Node/Electron kapatıp `npx prisma generate`.

---

*Oluşturulma amacı: yedek geri yükleme / sohbet sıfırlanması sonrası bağlam kaybını azaltmak.*
