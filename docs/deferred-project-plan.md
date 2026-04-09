# Ertelenen ürün notları ve faz planı (resmî)

Bu dosya **repoda sürüm kontrolündedir**. Cursor’daki .cursor/not-deferred-todos.md çalışma kopyası olabilir; **çakışmada bu dosya önceliklidir**.

---

# Deferred Test Notes

Bu dosya, kullanÄ±cÄ±dan gelen ve `not ...` ile baÅŸlayan talepleri geÃ§ici olarak tutar.

## Notes

1. âœ… EkranÄ± kÃ¼Ã§Ã¼ltÃ¼p bÃ¼yÃ¼tme iÅŸlemlerinde tÃ¼m paneller ve fontlar ekranla birlikte kÃ¼Ã§Ã¼lÃ¼p bÃ¼yÃ¼yebilsin. **(TamamlandÄ±)**
2. âœ… Header Ã¼zerindeki `Panel / MÃ¼ÅŸteri / GÃ¶rev / HatÄ±rlatmalar / Ekip / Arama` seÃ§im alanlarÄ±nÄ± siyah renk yapalÄ±m. **(TamamlandÄ±)**
3. âœ… Ana ekran Ã¼stÃ¼ndeki `Smart Planner` yazÄ±sÄ±nÄ±n devamÄ±na `/` ile mevcut fontun yarÄ±sÄ± Ã¶lÃ§Ã¼sÃ¼nde versiyon numarasÄ± koyalÄ±m. **(TamamlandÄ±)**
4. âœ… HatÄ±rlatma bildirimi ekranÄ± zemini tam net olsun; mÃ¼dahale edilinceye kadar her 5 saniyede bir uyarÄ± sesi Ã§alsÄ±n. **(TamamlandÄ±)**
5. âœ… Dashboard fullscreen / large-screen polish (not 5, 5a-5g): **(TamamlandÄ±)**
   - Sorun: Fullscreen kullanÄ±mda iÃ§erik Ã§ok/fazla yayÄ±lÄ±yor, bazÄ± alanlar kÃ¼Ã§Ã¼k kalÄ±yor, Ã¼st alanlar ince kalÄ±yor ve boÅŸluk dengesi zayÄ±flÄ±yor.
   - AmaÃ§: Fullscreen'de daha dolu, dengeli, profesyonel ve kontrollÃ¼ dashboard hissi.
   - 5a) Large-screen breakpoint ekle:
     - 1440px+ iÃ§in ayrÄ± dÃ¼zen tanÄ±mla.
     - Gerekirse 1600px+ iÃ§in ikinci seviye dÃ¼ÅŸÃ¼n.
   - 5b) Container geniÅŸliÄŸini kontrol et:
     - Ä°Ã§erik sonsuza kadar yayÄ±lmasÄ±n.
     - Dashboard ana container iÃ§in uygun max-width kullan.
     - Ä°Ã§eriÄŸi ortala.
   - 5c) Ãœst alanÄ± gÃ¼Ã§lendir:
     - Header altÄ±ndaki CTA alanÄ± fullscreen'de daha dengeli gÃ¶rÃ¼nsÃ¼n.
     - Ã‡ok ince/yayvan gÃ¶rÃ¼nmesin.
     - Padding ve yÃ¼kseklik large-screen'de optimize edilsin.
   - 5d) Ãœst aksiyon kartlarÄ±nÄ± iyileÅŸtir:
     - Fullscreen'de fazla yatay yayÄ±lmasÄ±nlar.
     - OranlarÄ± daha dengeli olsun.
     - Gerekirse min-height veya daha iyi iÃ§ spacing ver.
   - 5e) Alt grid'i large-screen iÃ§in optimize et:
     - Kartlar Ã§ok kÃ¼Ã§Ã¼k gÃ¶rÃ¼nmesin.
     - Kart iÃ§ padding ve baÅŸlÄ±k boyutlarÄ± bÃ¼yÃ¼k ekrana gÃ¶re ayarlansÄ±n.
     - Gap ve spacing dengelensin.
     - Kartlar eÅŸit yÃ¼kseklikte kalsÄ±n.
   - 5f) BoÅŸluk sistemini dÃ¼zelt:
     - CTA alanÄ± ile Ã¼st kartlar arasÄ±.
     - Ãœst kartlar ile alt grid arasÄ±.
     - Grid iÃ§i gap.
     - Large-screen'de ayrÄ± optimize edilsin.
   - 5g) GÃ¶rsel hiyerarÅŸiyi koru:
     - Fullscreen'de layout bÃ¼yÃ¼sÃ¼n ama daÄŸÄ±lmasÄ±n.
     - Odak alanlarÄ± net kalsÄ±n.
     - Dashboard "ince yayÄ±lmÄ±ÅŸ" deÄŸil "oturmuÅŸ" gÃ¶rÃ¼nsÃ¼n.
   - Kurallar:
     - Mevcut tema, renk sistemi ve typography yapÄ±sÄ±nÄ± bozma.
     - Sadece fullscreen/large-screen dÃ¼zenini iyileÅŸtir.
     - KÃ¼Ã§Ã¼k ekran ve normal pencere davranÄ±ÅŸÄ±nÄ± bozma.
     - Mevcut component yapÄ±sÄ±nÄ± mÃ¼mkÃ¼n olduÄŸunca koru.
   - Teknik beklenti:
     - Breakpoint bazlÄ± spacing/padding dÃ¼zenle.
     - Max-width + centered layout kullan.
     - Grid ve kart oranlarÄ±nÄ± bÃ¼yÃ¼k ekran iÃ§in optimize et.
     - Gerekirse clamp(), minmax() veya responsive container mantÄ±ÄŸÄ± kullan.
   - Ä°ÅŸ bitince:
     - DeÄŸiÅŸen dosyalarÄ± sÃ¶yle.
     - Large-screen iÃ§in neyi neden deÄŸiÅŸtirdiÄŸini kÄ±sa Ã¶zetle.

6. **E-posta tabanlÄ± ÅŸifre sÄ±fÄ±rlama** (en sonda yapÄ±lacak)

   - **AmaÃ§:** Åifresini unutan kullanÄ±cÄ±lar kayÄ±tlÄ± e-posta ile gÃ¼venli sÄ±fÄ±rlama; gerekirse admin destekli alternatif.

   - **KullanÄ±cÄ± akÄ±ÅŸÄ±:**
     1. GiriÅŸ ekranÄ±nda â€œÅifremi unuttum?â€ baÄŸlantÄ±sÄ±.
     2. KullanÄ±cÄ± e-posta girer.
     3. Sistem kullanÄ±cÄ± varsa tek kullanÄ±mlÄ±k sÄ±fÄ±rlama kodu Ã¼retir.
     4. Kod e-posta ile gÃ¶nderilir.
     5. KullanÄ±cÄ± kodu girer.
     6. Kod doÄŸrulanÄ±rsa yeni ÅŸifre oluÅŸturur.

   - **GÃ¼venlik / davranÄ±ÅŸ kurallarÄ±:**
     - KullanÄ±cÄ± var/yok aÃ§Ä±k edilmesin; her durumda nÃ¶tr mesaj: *â€œEÄŸer bu e-posta sistemde kayÄ±tlÄ±ysa, ÅŸifre sÄ±fÄ±rlama kodu gÃ¶nderildi.â€*
     - Kod tek kullanÄ±mlÄ±k.
     - Kod sÃ¼reli (Ã¶rn. 10 veya 15 dakika).
     - Kod dÃ¼z metin saklanmasÄ±n; hashâ€™li saklansÄ±n.
     - Ã‡oklu hatalÄ± denemede geÃ§ici kilit.
     - Yeni ÅŸifre iÃ§in doÄŸrulama kurallarÄ± (kayÄ±t ile uyumlu / gÃ¼Ã§lendirilmiÅŸ).
     - Yeni ÅŸifre eski ÅŸifre ile aynÄ± olamaz.
     - Ä°ÅŸlemler audit logâ€™da.

   - **Teknik:**
     - Prisma ÅŸemasÄ±: gerekli tablo/alanlar (token hash, expiry, kullanÄ±ldÄ± bayraÄŸÄ±, user ref, vb.).
     - API routeâ€™larÄ± (istek kodu, doÄŸrula, ÅŸifre gÃ¼ncelle â€” modÃ¼ler).
     - Mail: modÃ¼ler servis katmanÄ± (provider agnostic; env ile SMTP/API).
     - UI: e-posta â†’ kod â†’ yeni ÅŸifre sayfalarÄ±; gÃ¼venli/nÃ¶tr hata mesajlarÄ±.
     - Mevcut auth/session yapÄ±sÄ±nÄ± bozmadan entegre et.

   - **Ek akÄ±ÅŸ:**
     - â€œAdminden yardÄ±m isteâ€: ÅŸimdilik UI + temel iÅŸlem iskeleti.
     - Admin reset mantÄ±ÄŸÄ±nÄ±n ileride geniÅŸletileceÄŸi yerler (Ã¶zet): Ã¶rn. `src/app/api/admin/...` veya mevcut workspace admin APIâ€™leri + `src/lib/access-policy.ts` + audit; UI: `src/app/...` veya mevcut team paneli.

   - **Uygulama sÄ±rasÄ±:** Not 1â€“5 bittikten sonra; ardÄ±ndan gÃ¼venlik raporundaki kritik maddeler (sabit admin shortcut vb.) ile birlikte planlanabilir.

7. âœ… **Ana panel â€œYeni gÃ¶revâ€ davranÄ±ÅŸÄ±** **(TamamlandÄ±)**

   - Åu an: Ana paneldeki yeni gÃ¶rev butonuna basÄ±nca uygulama GÃ¶revler sekmesine gidiyor.
   - Ä°stenen: AynÄ± anda / doÄŸrudan **yeni gÃ¶rev ekleme kartÄ±nÄ±n** (form/modal/panel â€” projedeki mevcut â€œyeni gÃ¶revâ€ UIâ€™si) aÃ§Ä±lmasÄ±; kullanÄ±cÄ± GÃ¶revler sayfasÄ±na yalnÄ±zca sekme deÄŸiÅŸimiyle deÄŸil, **ekleme akÄ±ÅŸÄ±nÄ±n tetiklenmesiyle** sonuÃ§ alsÄ±n.
   - Uygulama sÄ±rasÄ± geldiÄŸinde: Dashboard CTA â†’ `/tasks` yÃ¶nlendirmesi veya `router.push` yerine query/hash veya global state ile tasks sayfasÄ±nda panel aÃ§Ä±k baÅŸlatma (veya mevcut quick-task modalâ€™Ä±nÄ± dashboardâ€™dan tetikleme) â€” mevcut navigation ve gÃ¶rev oluÅŸturma bileÅŸenlerine zarar vermeden.

8. âœ… **GÃ¶rev oluÅŸturma: mÃ¼ÅŸteri dÄ±ÅŸÄ±, kullanÄ±cÄ±ya atama, bildirim, kabul ve durum** **(TamamlandÄ±)**

   - **Kapsam:** GÃ¶rev oluÅŸturma yalnÄ±zca mÃ¼ÅŸteriye baÄŸlÄ± olmamalÄ±; **workspaceâ€™teki tÃ¼m kullanÄ±cÄ±lar** (veya tanÄ±mlÄ± Ã¼ye seti) iÃ§in geÃ§erli olmalÄ±.
   - **UI:** GÃ¶rev oluÅŸturma kartÄ±nda **kullanÄ±cÄ± listesi** (gÃ¶revlendirilecek kiÅŸi/kiÅŸiler seÃ§imi) bulunmalÄ±.
   - **Bildirim:** GÃ¶revlendirilen kullanÄ±cÄ±nÄ±n ekranÄ±na **gÃ¶rev bildirimi / uyarÄ±** gelmeli (mevcut hatÄ±rlatma/chime veya benzeri kanalla uyumlu dÃ¼ÅŸÃ¼n).
   - **Kabul:** Bildirimi alan kullanÄ±cÄ± **â€œGÃ¶revi alâ€** (veya eÅŸdeÄŸer) ile gÃ¶revi kabul edince gÃ¶rev **â€œGÃ¶revlerimâ€** (veya kiÅŸisel gÃ¶rev listesi) gÃ¶rÃ¼nÃ¼mÃ¼nde listelenmeli.
   - **Durum:** Atanan kullanÄ±cÄ± gÃ¶rev iÃ§in **TamamlandÄ±** veya **TamamlanamadÄ±** (veya eÅŸdeÄŸer) seÃ§enekleriyle **gÃ¶rev durumunu** gÃ¶sterebilmeli; bu durumlar API + Prisma modelinde net alanlarla desteklenmeli (mevcut `Task` ÅŸemasÄ± ve izinlerle Ã§akÄ±ÅŸma analizi gerekir).
   - **Uygulama sÄ±rasÄ± geldiÄŸinde:** Åema (assignee, kabul bayraÄŸÄ±/tarihi, durum enum), API, gÃ¶rev listesi filtreleri, bildirim katmanÄ± ve gÃ¶rev oluÅŸturma formu birlikte tasarlanmalÄ±.

## Kural

- **Liste dondurma (karar):** Bu dosyadaki mevcut notlar **bitene kadar** listeye **yeni madde eklenmeyecek**; Ã¶nce 1â€“8 sÄ±rayla/Ã¶ncelikle kapatÄ±lacak, iÅŸler bitince gerekirse tekrar `not ...` ile geniÅŸletme yapÄ±labilir.
- Bu sÃ¼re iÃ§inde sohbette mÃ¼mkÃ¼nse **yeni `not` numarasÄ±** aÃ§Ä±lmamasÄ± hedeflenir (odak: mevcut liste).
- **not 6** ÅŸu an yalnÄ±zca bu listede; kod/Prompt ile uygulanmayÄ± **en sona** bÄ±rakÄ±ldÄ±.
- **not 6** en sonda kalan madde.
- âœ… not 5 iÃ§in â€œtamamlandÄ±â€ iÅŸaretinin 5aâ€“5g alt maddeleriyle tek tek doÄŸrulanmasÄ± talebi **(TamamlandÄ±)**.
- âœ… not 5 alt maddeleri (5aâ€“5g) tek tek kontrol talebi **(TamamlandÄ±)**.

## Yeni Faz PlanÄ± (Desktop -> Online GeÃ§iÅŸ)

9. **Desktop release candidate (RC) hazÄ±rlÄ±ÄŸÄ±** *(sÃ¼rÃ¼m 1.1.0 / paket sÃ¼rÃ¼mÃ¼ package.json ile hizalÄ±; `npm run pre-release` + `npm run desktop:build`)*

   - AmaÃ§: Son mevcut durumu masaÃ¼stÃ¼ `.exe` olarak paketleyip gerÃ§ek kullanÄ±m koÅŸulunda doÄŸrulamak.
   - Kapsam:
     - Desktop build/paket alma adÄ±mÄ±nÄ± netleÅŸtir.
     - Kurulum + ilk aÃ§Ä±lÄ±ÅŸ + temel akÄ±ÅŸ smoke test.
     - Veri yolu (`desktop.db`, template DB) doÄŸrulamasÄ±.
   - Ã‡Ä±ktÄ±: â€œRC hazÄ±râ€ onayÄ± ve test edilebilir installer/exe.

10. **1-2 gÃ¼nlÃ¼k pilot test dÃ¶nemi (ekip iÃ§i)**

   - AmaÃ§: GerÃ§ek kullanÄ±mda hatalarÄ± erken yakalamak.
   - Kapsam:
     - GÃ¼nlÃ¼k kullanÄ±m: mÃ¼ÅŸteri, gÃ¶rev, not, hatÄ±rlatma, ekip akÄ±ÅŸlarÄ±.
     - Kritik log/hata kayÄ±tlarÄ±nÄ±n toplanmasÄ±.
     - Pilot geri bildirim listesi (UI, performans, yetki, veri tutarlÄ±lÄ±ÄŸÄ±).
   - Ã‡Ä±ktÄ±: â€œGiderileceklerâ€ listesi ve Ã¶nceliklendirme.

11. **Pilot bulgularÄ±nÄ± kapatma**

   - AmaÃ§: Onlineâ€™a Ã§Ä±kmadan Ã¶nce kritik/major hatalarÄ± kapatmak.
   - Kapsam:
     - Kritik hatalar: zorunlu fix.
     - Major hatalar: mÃ¼mkÃ¼nse fix; ertelenecekler aÃ§Ä±kÃ§a notlanÄ±r.
     - GÃ¼venlik ve veri bÃ¼tÃ¼nlÃ¼ÄŸÃ¼ kontrolleri tekrar edilir.
   - Ã‡Ä±ktÄ±: â€œGo/No-Goâ€ kararÄ± iÃ§in temiz durum raporu.

12. **Go kararÄ± sonrasÄ± online geÃ§iÅŸ (GitHub + Supabase + Vercel)**

   - AmaÃ§: ÃœrÃ¼nÃ¼ kontrollÃ¼ ÅŸekilde canlÄ±ya almak.
   - Kapsam:
     - GÃ¼venli git push/PR akÄ±ÅŸÄ±.
     - Supabase prod veritabanÄ±/env kurulumu.
     - Vercel deploy + env deÄŸiÅŸkenleri + ilk canlÄ± doÄŸrulama.
   - Ã‡Ä±ktÄ±: CanlÄ± URL + eriÅŸim + temel saÄŸlÄ±k kontrolleri.

13. **Ekip kullanÄ±mÄ±na geÃ§iÅŸ ve operasyon rutini**

   - AmaÃ§: ÃœrÃ¼nÃ¼n gÃ¼nlÃ¼k ekip kullanÄ±mÄ± iÃ§in sÃ¼rdÃ¼rÃ¼lebilir hale gelmesi.
   - Kapsam:
     - Rol/yetki ve onboarding netleÅŸtirme.
     - Yedekleme/geri dÃ¶nÃ¼ÅŸ planÄ±.
     - SÃ¼rÃ¼m notu, hata bildirim ve hotfix rutini.
   - Ã‡Ä±ktÄ±: â€œEkip mantÄ±ÄŸÄ± ile kullanÄ±m baÅŸladÄ±â€ durumu.

