# Smart Client Planner — Kurulum (Türkçe)

Bu dosya projeyi sıfırdan çalışır hale getirmek için gereken adımları özetler.

**Uçtan uca işletim rehberi:** [`docs/detayli-tarif.md`](docs/detayli-tarif.md)

## Gereksinimler

- **Node.js** 20.9 veya üzeri (`package.json` içinde `engines` tanımlı)
- **SQLite** (yerel geliştirme için otomatik; `prisma/dev.db`)

## 1. Bağımlılıkları yükleyin

```bash
npm install
```

## 2. Ortam değişkenleri

`.env.example` dosyasını kopyalayın:

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

`.env` içinde düzenleyin:

| Değişken        | Açıklama                                      |
|-----------------|-----------------------------------------------|
| `DATABASE_URL`  | SQLite dosya adresi (varsayılan: `file:./dev.db`) |
| `JWT_SECRET`    | Oturum imzası için güçlü rastgele bir dize    |

## 3. Dev ortam doğrulama + veritabanı hazırlığı

```bash
npm run predev
npm run prisma:migrate -- --name init
npm run prisma:seed
```

## 4. Geliştirme sunucusu

```bash
npm run dev
```

Turbopack olmadan çalıştırmak isterseniz:

```bash
npm run dev:fast
```

Tarayıcı: [http://localhost:3022](http://localhost:3022) (`package.json` içinde `dev` script’i bu portu kullanır.)

**Demo giriş:**

- E-posta: `demo@smartclientplanner.com`
- Şifre: `demo1234`

## Web, mobil ve masaüstü (PWA)

- Tarayıcıdan kullanım: normal web sitesi gibi **responsive** çalışır.
- **Mobil (Android / iPhone):** Chrome veya Safari’de menüden **“Ana ekrana ekle”** / **“Uygulama yükle”** ile tam ekran uygulama gibi açılabilir (`manifest` + ikon).
- **Masaüstü (Windows / Mac):** Chrome / Edge’de adres çubuğundaki **yükle** simgesiyle **PWA** olarak kurulabilir; ayrı pencerede çalışır.

Üretimde PWA’nın tam özellikleri için sitenin **HTTPS** üzerinden yayınlanması gerekir. Yerelde `http://localhost:3022` ile de test edebilirsiniz.

## Dil (i18n)

- Varsayılan dil: **Türkçe** (`tr`)
- İkincil dil: **İngilizce** (`en`)
- Dil seçimi `localStorage` ve `lang` çerezinde saklanır; ilk ziyarette tarayıcı dili (`Accept-Language`) kullanılır (`src/middleware.ts`).

## VS Code

`.vscode/extensions.json` içinde önerilen eklentiler listelenir (ESLint, Tailwind, Prisma). Açınca “Recommended” ile yükleyebilirsiniz.

## Sorun giderme

- **`npx` / `node` bulunamıyorsa:** Node.js LTS kurun ve terminali yeniden açın.
- **Prisma bağlantı hatası:** `DATABASE_URL` değerini ve `prisma/dev.db` dosya izinlerini doğrulayın.
- **Lint:** `npm run lint` — ESLint 9 için `eslint.config.mjs` kullanılır.
