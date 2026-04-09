# Smart Client Planner — Detaylı işletim tarifi

Bu belge, projeyi **kurmadan**, **geliştirmeden**, **test edip sürümlemekten** ve **yönetmekten** sorumlu kişiler için uçtan uca rehberdir. Parça parça komutlar, GitHub/Vercel adımları ve sık karşılaşılan hatalar burada toplanmıştır.

---

## 1. Önce okunacaklar ve dosya haritası

| Belge | Ne zaman |
|--------|-----------|
| [`KURULUM.md`](../KURULUM.md) | İlk klon sonrası yerel kurulum özeti |
| [`docs/ADMIN.md`](ADMIN.md) | Repo yöneticisi: dal koruması, sırlar, acil |
| [`docs/release-checklist.md`](release-checklist.md) | Sürüm / EXE öncesi kısa kontrol listesi |
| [`docs/deploy-setup.md`](deploy-setup.md) | GitHub, Vercel, Supabase, masaüstü güncelleme |
| [`docs/desktop-beta-checklist.md`](desktop-beta-checklist.md) | Windows `.exe` duman testi |
| [`docs/deferred-project-plan.md`](deferred-project-plan.md) | Ertelenen ürün maddeleri ve faz planı (resmî kopya) |

---

## 2. Mimari özeti

- **Web uygulaması:** Next.js (App Router), React, Tailwind. API route’lar `src/app/api/` altında.
- **Veri:** Prisma ORM; geliştirmede varsayılan **SQLite** (`DATABASE_URL=file:./dev.db` veya projede tanımlı yol).
- **Kimlik:** Çerez tabanlı oturum; `JWT_SECRET` zorunlu.
- **Çalışma alanı (workspace):** Müşteri, not, görev kayıtları workspace’e bağlı; roller **ADMIN** / **USER**.
- **Masaüstü (isteğe bağlı):** Electron; paket içinde Next **standalone** sunucusu ve yerel `desktop.db` (şablon: `desktop-template.db`).
- **Denetim:** `AuditEvent` tablosu + rapor ekranında birleşik aktivite satırları.

---

## 3. Gereksinimler

- **Node.js** ≥ 20.9 (`package.json` → `engines`).
- **Git**.
- **Windows** üzerinde masaüstü derlemesi için: Visual Studio Build Tools / uygun SDK (electron-builder dokümantasyonuna göre); imza yoksa `CSC_IDENTITY_AUTO_DISCOVERY=false` ile derlenir (mevcut script’te var).

---

## 4. İlk kurulum (yerel, adım adım)

### 4.1 Depoyu alın

```bash
git clone https://github.com/serhat35860/smart-client-planner.git
cd smart-client-planner
```

Fork kullanıyorsanız URL’yi kendi fork’unuzla değiştirin.

### 4.2 Bağımlılıklar

```bash
npm install
```

### 4.3 Ortam dosyası

`.env.example` → `.env` kopyalayın; en azından:

| Değişken | Açıklama |
|----------|-----------|
| `DATABASE_URL` | Örn. `file:./dev.db` (SQLite) |
| `JWT_SECRET` | En az 32 karakter, rastgele |

Üretimde `DATABASE_URL` genelde Postgres (Supabase connection string).

### 4.4 Veritabanı ve örnek veri

```bash
npm run predev
```

Bu; ortam doğrulaması ve mümkünse `prisma generate` dener.

İlk migrasyon ve seed (KURULUM ile uyumlu):

```bash
npm run prisma:migrate -- --name init
npm run prisma:seed
```

Mevcut bir veritabanında migrasyon uygulamak için: `npx prisma migrate deploy` (üretim).

### 4.5 Geliştirme sunucusu

```bash
npm run dev
```

Bu projede varsayılan port **`3022`** tanımlıdır (`package.json` → `dev` script). Tarayıcı:

**http://localhost:3022**

> Not: `KURULUM.md` içinde eski örnek olarak `3000` geçebilir; güncel script **3022** kullanır.

---

## 5. Günlük geliştirme akışı

1. `main` veya feature dalında çalışın.
2. Değişiklikten sonra: `npm run lint` (veya tam kontrol için aşağıdaki test bölümü).
3. API/şema değiştiyse migrasyon üretin ve commit edin.
4. Pull request açıyorsanız CI (`ci-security`) yeşil olmalı.

**Prisma client güncellenmediyse** (IDE veya başka süreç DLL kilitliyse Windows’ta `EPERM`):

- Tüm `node` / `npm run dev` süreçlerini kapatın veya `npm run dev:stop` (Windows, port 3022).
- Sonra: `npx prisma generate`.

---

## 6. NPM script sözlüğü (özet)

| Komut | Görevi |
|--------|--------|
| `npm run dev` | Next dev (Turbopack, port 3022) |
| `npm run dev:fast` | Turbopack olmadan dev |
| `npm run dev:stop` | Windows: 3022 dinleyen süreci kapatır (Prisma kilidi için) |
| `npm run cache:clear` | `.next` klasörünü siler |
| `npm run build` | Production Next derlemesi |
| `npm run start` | Derlenmiş uygulamayı `next start` ile çalıştırır |
| `npm test` | Vitest birim testleri |
| `npm run release:check` | lint → prisma-try → tsc → test |
| `npm run release:check:full` | `release:check` + `build` |
| `npm run pre-release` | (Win) dev kilidi + `.next` temizliği + `release:check` + `build` |
| `npm run desktop:prebuild` | `build` + standalone asset + desktop DB şablonu |
| `npm run desktop:build` | Tam Windows NSIS installer üretimi |
| `npm run desktop:dev` | Next + Electron geliştirme |
| `npm run prisma:migrate` | Geliştirme migrasyonu |
| `npm run prisma:seed` | Seed |

---

## 7. Test ve kalite kapısı

- **Lint:** `npm run lint`
- **Tip:** `npx tsc --noEmit` (test dosyaları `tsconfig` ile hariç tutulabilir)
- **Birim testleri:** `npm test` — `src/lib/**/*.test.ts`
- **Sürüm öncesi tek şot:** `npm run pre-release` (Windows’ta önerilir)

**CI (GitHub Actions):** `.github/workflows/ci-security.yml` — push/PR’da lint, Prisma generate, test, build, `npm audit`, Gitleaks.

**Elle CI:** GitHub → **Actions** → **ci-security** → **Run workflow** (`workflow_dispatch`).

---

## 8. Sürüm numarası ve sürüm notları

1. **`package.json` → `version`** alanını artırın (semver: `MAJOR.MINOR.PATCH`).  
   Örnek: `1.1.0`.

2. **`src/lib/version-notes.ts`** içinde kullanıcıya görünen sürüm notu bloğu ekleyin (ürün sürüm etiketi örn. `v1.6.0` ile anlatım; installer satırında `package.json` sürümüyle uyum yazın).

3. Git etiketi:

```bash
git tag -a v1.1.0 -m "Smart Client Planner 1.1.0"
git push origin v1.1.0
```

Etiket adı `v` + `package.json` sürümü ile aynı olmalı.

---

## 9. Git ve GitHub iş akışı

### 9.1 Önerilen dal modeli

- **`main`:** Dağıtıma hazır kod.
- Özellikler: `feature/...` dalları → PR → `main`.

### 9.2 CODEOWNERS

`.github/CODEOWNERS` dosyasında varsayılan sahip `@serhat35860` tanımlıdır. Organizasyon/ekip değiştiyse GitHub kullanıcı adlarını güncelleyin.

### 9.3 Dal koruması (Settings → Branches)

Önerilen ayarlar (`docs/ADMIN.md` ile uyumlu):

- `main` için merge yalnızca **pull request** ile.
- Gerekli **status check:** `build-and-audit` (veya iş akışınızın raporladığı isim).
- İsteğe bağlı: en az bir onay.

---

## 10. Masaüstü (Windows EXE) ve GitHub Releases

### 10.1 Derleme

```bash
npm run dev:stop
npm run desktop:build
```

Süre uzun olabilir; disk ve antivirus geçici olarak yavaşlatabilir.

### 10.2 Çıktı

`dist-desktop/` altında NSIS kurulum dosyası, `latest.yml`, `.blockmap` vb.

### 10.3 Release yükleme

1. GitHub → **Releases** → **Draft a new release**.
2. **Tag:** örn. `v1.1.0` (mevcut etiketi seçin veya oluşturun).
3. Başlık ve notlar (changelog).
4. **`dist-desktop`** içindeki ilgili dosyaları **ek** olarak yükleyin (özellikle `latest.yml`, `.exe`, `.blockmap`).

### 10.4 Otomatik güncelleme

`package.json` → `build` → `publish` bu repoda **serhat35860/smart-client-planner** GitHub deposunu işaret eder. Fork’ta `owner` / `repo` değiştirin.

Alternatif: çalışma zamanında `DESKTOP_UPDATE_OWNER` / `DESKTOP_UPDATE_REPO` (bkz. `electron/main.ts`).

---

## 11. Web üretimi (Vercel + veritabanı) — kısa yol

Ayrıntılı adımlar: [`docs/deploy-setup.md`](deploy-setup.md).

Özet:

1. Supabase (veya Postgres) oluşturun; `DATABASE_URL` ve gerekirse connection pooling URL’sini alın.
2. Vercel’de projeyi bağlayın; ortam değişkenlerini girin (`JWT_SECRET`, `DATABASE_URL`, vb.).
3. `npx prisma migrate deploy` üretim veritabanında çalıştırılmalı (Vercel build hook veya manuel).
4. İlk deploy sonrası canlı URL’de giriş ve kritik akışları doğrulayın.

---

## 12. Güvenlik ve sırlar

- **Asla** `.env`, `.env.local` veya gerçek `JWT_SECRET` / veritabanı parolasını commit etmeyin.
- Üretim sırları yalnızca **GitHub Secrets** / **Vercel Environment Variables** / **Supabase** panelinde.
- Bağımlılık taraması: `npm run security:audit` ve CI içindeki `npm audit`.

---

## 13. Sorun giderme

| Belirti | Olası çözüm |
|---------|-------------|
| `EPERM` / Prisma `query_engine` | `npm run dev:stop`, tüm Node süreçlerini kapat, `npx prisma generate` |
| Next build `_document` / turbopack chunk hatası | `npm run cache:clear` veya `.next` sil, yeniden `npm run build` |
| Port 3022 meşgul | `npm run dev:stop` veya görev yöneticisinden ilgili `node` sürecini kapatın |
| Masaüstü boş sayfa | Log: Electron menü → Support → Open Log Folder; Next standalone yolunu kontrol edin |
| Raporlar boş / 403 | Raporlar yalnızca **ADMIN** workspace rolüne açıktır |

---

## 14. Ürün yol haritası (ertelenen işler)

Tek doğruluk kaynağı repoda: [`docs/deferred-project-plan.md`](deferred-project-plan.md).  
Cursor altındaki `.cursor/not-deferred-todos.md` çalışma notu olabilir; **çakışmada `docs` dosyası esas alınır**.

---

## 15. Hızlı kontrol listesi — “Bugün sürüm çıkarıyorum”

- [ ] `git pull` ve temiz çalışma ağacı (veya PR birleştirildi)
- [ ] `package.json` sürümü ve `version-notes.ts` güncel
- [ ] `npm run pre-release` başarılı
- [ ] (Masaüstü) `npm run desktop:build` ve `dist-desktop` kontrol
- [ ] `git tag` + `git push origin vX.Y.Z`
- [ ] GitHub **Release** oluştur; gerekli dosyaları ekle
- [ ] (Web) Vercel deploy ve üretim env doğrulandı

---

*Son güncelleme: proje sürümü `package.json` içindeki `version` ile uyumlu tutulmalıdır.*
