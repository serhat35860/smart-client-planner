# Sürüm / EXE öncesi kontrol listesi

## Tek komut (önerilen)

Önce **Next dev** açıksa kapatın veya:

```bash
npm run dev:stop
```

Ardından tam doğrulama + production build:

```bash
npm run pre-release
```

Bu sıra (Windows’ta): **port 3022 kilidi** → **`.next` sil** → **`release:check`** (lint, prisma-try, tsc, vitest) → **`npm run build`**.

Ortam değişkenleri set değilse script `DATABASE_URL=file:./dev.db` ve `JWT_SECRET` için CI ile uyumlu varsayılan kullanır.

## Parça parça

```bash
npm run release:check
```

```bash
npm run release:check:full
```

`release:check:full` = `release:check` + `build` (kilit temizliği **yok**).

Masaüstü installer:

```bash
npm run desktop:build
```

## Otomatik güncelleme (electron-updater)

`package.json` içinde `build.publish` bilerek **boş** bırakıldı; yanlış GitHub `REPLACE_ME` adresi gömülmesin diye.

- Güncelleme yayınlarken: build sırasında `build.publish` doldurun **veya** paketlenmiş uygulama ortamında `DESKTOP_UPDATE_OWNER` / `DESKTOP_UPDATE_REPO` kullanın (`electron/main.ts`).

## Elle smoke

- Giriş / çıkış, müşteri + not + görev CRUD
- Raporlar: PDF/Excel
- Masaüstü: `docs/desktop-beta-checklist.md`

## Yayın öncesi

- [ ] `npm run pre-release` yeşil
- [ ] [İsteğe bağlı] `npm run desktop:build` + kurulum testi
- [ ] `src/lib/version-notes.ts` güncellendi mi?
- [ ] GitHub Release kullanıyorsanız `publish` veya `DESKTOP_UPDATE_*` tanımlı mı?
