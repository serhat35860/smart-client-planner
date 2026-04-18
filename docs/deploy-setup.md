# Dağıtım rehberi: GitHub, Vercel, Supabase, masaüstü otomatik güncelleme

Bu dosya **senin yapacakların** için adım adım bir kontrol listesidir. Gizli anahtarları sohbete yapıştırmana gerek yok; Vercel / GitHub arayüzünde tanımlaman yeterlidir.

---

## 1. Bana (veya repoya) iletmen gereken bilgiler

Aşağıdakileri not et; istersen tek tek paylaşıp kod tarafında `package.json` vb. güncellemesi isteyebilirsin.

| Bilgi | Örnek | Nerede kullanılır |
|--------|--------|-------------------|
| GitHub kullanıcı veya organizasyon | `sirketim` | Electron `publish`, Release’ler |
| GitHub repo adı | `smart-client-planner` | Aynı |
| Repo **public** mi **private** mi? | Public önerilir (ücretsiz güncelleme kolay) | Private ise güncelleme için token stratejisi gerekir |
| Vercel proje adı / domain | `app.ornek.com` | DNS, env |
| Supabase proje referansı | Proje panelinden | Connection string |
| Üretim `JWT_SECRET` | En az 32 karakter, rastgele | Vercel env (asla commit etme) |

---

## 2. GitHub — genel

1. Repoyu oluştur veya mevcut repoyu kullan.
2. Yerel projede `git remote` ile bu repoyu bağla.
3. Ana dal politikası: öneri `main` → production / release etiketleri.

**Dallanma:** İstersen `develop` + `main`; release tag’lerini `main` üzerinden at.

---

## 3. Masaüstü (Windows `.exe`) ve otomatik güncelleme

Otomatik güncelleme **GitHub Releases** üzerinden çalışır: `electron-updater` paket içindeki `app-update.yml` dosyasından `owner` / `repo` bilgisini okur.

### 3.1 Senin yapacakların

1. **`package.json`** içinde `build.publish` altındaki `owner` ve `repo` değerlerini **kendi GitHub bilgilerinle** değiştir (`REPLACE_ME` kalmasın).
2. Her test / prod sürümünde **`package.json` içindeki `version`** alanını artır (ör. `1.0.2`). Aynı sürüm numarasıyla ikinci kez release yayınlama.
3. Temiz derleme:
   ```bash
   npm run desktop:build
   ```
4. Çıktı klasörü: **`dist-desktop/`** (kurulum dosyası, `latest.yml`, `.exe`, `.blockmap` vb.).
5. GitHub’da **Releases → New release**:
   - **Tag:** `v` + sürüm (ör. `v1.0.2`) — `package.json` ile uyumlu olsun.
   - **Release notes** kısa changelog.
   - **`dist-desktop`** içindeki ilgili dosyaları **eklenti olarak yükle** (özellikle `latest.yml`, `.exe`, `.exe.blockmap` — electron-builder ürettiyse hepsini aynı release’e koy).

6. Endüstri kullanıcılarına: yeni kurulum veya eski sürüm açılınca uygulama GitHub’daki son release’i kontrol eder; yeni sürüm varsa indirme / yeniden başlatma akışı devreye girer.

### 3.2 İsteğe bağlı: farklı repo veya override

- Ortam değişkeni **`DESKTOP_UPDATE_OWNER`** ve **`DESKTOP_UPDATE_REPO`** yalnızca `app-update.yml` yerine **elle feed** vermek istersen kullanılır (genelde gerekmez).

### 3.3 Private repo notu

- Public repo + public release: en az sürtünme.
- Private repo: `electron-updater` için genelde **GitHub Personal Access Token** ve özel yapılandırma gerekir; bu rehberin basit yolu public release’lerdir.

---

## 4. Vercel — web (Next.js)

Vercel, repoyu import edip her push’ta (veya sadece `main`’de) derler.

### 4.1 Senin yapacakların

1. [vercel.com](https://vercel.com) → **Add New Project** → GitHub repo seç.
2. **Framework Preset:** Next.js (otomatik algılanır).
3. **Build Command:** varsayılan genelde `next build` yeterlidir. Bu projede `prebuild` `validate-dev-env` çalıştırır; **Vercel ortamında `VERCEL=1`** tanımlıdır, Postgres URL uyarısı için bkz. aşağı.
4. **Install Command:** `npm install` (veya lockfile’a göre `npm ci`).
5. **Environment Variables** (Production / Preview ayrı ayrı ayarlanabilir):

   | Değişken | Açıklama |
   |----------|-----------|
   | `JWT_SECRET` | Üretimde güçlü, en az 32 karakter |
   | `DATABASE_URL` | **Supabase Postgres** connection string (aşağıdaki bölüm) |
   | İleride ihtiyaç olursa | `NODE_ENV` Vercel tarafından set edilir |

6. İlk deploy sonrası domain’i **Project → Settings → Domains** üzerinden bağla.

### 4.2 Önemli: şu anki repo ve veritabanı

- Prisma şeması bu repoda **`provider = "sqlite"`** olarak tanımlıdır.
- **Vercel sunucusunda kalıcı SQLite dosyası kullanılamaz**; web’ü gerçekten yayına almak için **PostgreSQL** (ör. Supabase) ve Prisma şemasında **`provider` değişikliği + migration** gerekir.
- Sadece “statik deneme” veya edge case istisnaları hariç, **üretim web = Postgres** varsayımıyla ilerle.

---

## 5. Supabase + Prisma (PostgreSQL’e geçiş — web için)

Bu bölüm **kod değişikliği** gerektirir; tek başına panelde URL girmek yetmez.

### 5.1 Supabase tarafında senin yapacakların

1. [supabase.com](https://supabase.com) → yeni proje.
2. **Settings → Database** bölümünden:
   - **Connection string** (URI) — genelde “Transaction” veya “Session” pooler URL’si uygulama için,
   - Migration / `prisma migrate` için bazen **doğrudan (direct)** host gerekir — Supabase dokümantasyonundaki “Direct connection” veya “Connection pooling” ayrımına bak.
3. Şifreyi ve URL’yi **yalnızca Vercel Environment Variables** içine yapıştır; repoya koyma.

### 5.2 Repoda yapılması gerekenler (geliştirici / PR)

1. `prisma/schema.prisma` içinde:
   - `datasource db { provider = "postgresql" url = env("DATABASE_URL") }`
   - İsteğe bağlı: `directUrl = env("DIRECT_URL")` (pooler + migrate senaryosu için).
2. SQLite’a özgü tipler / farklar varsa migration ile düzeltilir.
3. `npx prisma migrate dev` (yerelde Postgres’e karşı) veya staging’de `prisma migrate deploy`.
4. Vercel **Build Command** örneği (ihtiyaca göre):
   ```bash
   npx prisma generate && npm run build
   ```
   ve deploy öncesi/sonrası migration stratejisi (Vercel build hook veya ayrı CI job).

**Özet:** Supabase’i seçtin → URL’yi Vercel’e yazdın → **henüz yetmez**; şema `postgresql` olunca web üretim ortamı anlamlı çalışır.

---

## 6. Ortam değişkenleri — hızlı özet

| Ortam | `DATABASE_URL` | `JWT_SECRET` |
|--------|----------------|--------------|
| Yerel geliştirme | `file:./dev.db` (SQLite) | `.env` |
| Masaüstü exe | Uygulama `userData/desktop.db` (gömülü şablon) | Derleme / runtime (session secret için repoda `DESKTOP_SESSION_SECRET` vb. dokümante edilebilir) |
| Vercel (web) | Supabase Postgres URI | Vercel Secrets |

---

## 7. Dağıtım öncesi kontrol listesi

- [ ] GitHub `owner` / `repo` ve `package.json` `version` güncel.
- [ ] Masaüstü: `npm run desktop:build` hatasız; Release’e `latest.yml` + installer yüklendi.
- [ ] Web: Postgres’e geçildiyse migration uygulandı; Vercel’de giriş / kayıt duman testi.
- [ ] `JWT_SECRET` üretimde tahmin edilemez ve yeterince uzun.
- [ ] Gizli bilgiler repoda **yok** (`.gitignore` içinde `.env`, `.env.local`).

---

## 8. Benden isteyebileceğin net talepler

- “`package.json` publish alanını şu owner/repo ile güncelle.”
- “Vercel build komutunu ve Prisma migrate adımını `package.json` / dokümana yaz.”
- “`schema.prisma` için PostgreSQL geçiş diff’i hazırla (migration dahil).”

Bu dosya senin **tek kaynak kontrol listesi** olarak kalmalı; servis panellerinde yaptığın işlemleri buradaki maddelerle işaretleyerek ilerleyebilirsin.
