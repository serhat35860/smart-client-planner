# Yönetici (admin) işletim notları

Bu depo için **tam yetkili** bakım adımları. Gizli değerleri sohbete yapıştırmayın; yalnızca GitHub / Vercel / Supabase arayüzünde tanımlayın.

**Adım adım geniş rehber:** [`docs/detayli-tarif.md`](detayli-tarif.md)

## GitHub

1. **`main` dal koruması** (Settings → Branches → Branch protection rules):
   - Pull request zorunlu, en az bir onay (ekip varsa).
   - Durum kontrolleri: `ci-security` iş akışı yeşil olsun.
   - `v*` etiketleri veya release dalları için ayrı kural isteğe bağlı.

2. **Sürüm (Release)**:
   - Etiket: `package.json` `version` ile uyumlu (örn. `v1.1.0`).
   - Masaüstü: `npm run desktop:build` sonrası `dist-desktop/` içindeki `latest.yml`, `.exe`, `.blockmap` dosyalarını aynı release’e yükleyin.
   - `build.publish` bu repoda `serhat35860/smart-client-planner` ile tanımlıdır; fork’ta değiştirin.

3. **CI’yı elle çalıştırma**: Actions → `ci-security` → **Run workflow** (`workflow_dispatch`).

## Ortam sırları (üretim)

| Değişken | Not |
|----------|-----|
| `JWT_SECRET` | ≥32 karakter, rastgele |
| `DATABASE_URL` | Supabase / Postgres connection string |
| Vercel’de üretim ortamına ayrı set | Geliştirme `.env.local` asla commit edilmez |

## Veritabanı

- Şema değişikliğinde: `prisma migrate deploy` (üretim).
- Masaüstü şablon: `scripts/prepare-desktop-db.mjs` ve `desktop-template.db` yeniden üretim akışına bakın.

## Acil

- Oturum / güvenlik şüphesi: ilgili kullanıcı için workspace üyesi **pasif** veya şifre sıfırlama (özellik geldiğinde) + audit log incelemesi.
