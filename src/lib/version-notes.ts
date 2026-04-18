export type VersionNote = {
  version: string;
  date: string;
  title: string;
  items: string[];
};

/** Yol haritası / backlog: henüz paketlenmemiş veya ertelenmiş maddeler; sürüm notları ekranında ayrı listelenir. */
export const plannedNotInCurrentInstaller: string[] = [
  "Excel şablonu ile müşteri listesi toplu import",
  "GitHub + Supabase + Vercel ile online dağıtım (güvenli push, env, ilk canlı doğrulama) — docs/deploy-setup.md ve not 9–12",
  "Masaüstü RC ve 1–2 günlük ekip pilotu (not 9–10)",
  "E-posta ile şifre sıfırlama (not 6)"
];

export const productCapabilities: string[] = [
  "Müşteri, not ve görev yönetimi tek çalışma alanında",
  "Bağımsız not, müşteriye bağlı not ve görev dönüşüm akışı",
  "Görev oluştururken başlık yanında isteğe bağlı detay/içerik metni ekleme",
  "Hatırlatma planlama, erteleme ve tamamlama akışı",
  "Takım üyeliği yönetimi (admin/kullanıcı, aktif/pasif)",
  "Kullanıcı rolünde ekip ekranında kendi üyelik/profil bilgisini görüntüleme ve güncelleme",
  "Admin tarafından doğrudan kullanıcı oluşturma",
  "E-posta veya kullanıcı adı ile giriş desteği",
  "Masaüstü kurulumda (exe) güvenli giriş doğrulaması ve otomatik güncelleme altyapısı",
  "Panelde görev filtreleri (Görevlerim, tümü, tamamlanamayan, tamamlanan)",
  "Rapor ekranı (tarih aralığı, PDF/Excel çıktı)",
  "Müşteri dosya numarası (YYYY-N, yıl bazlı sıra; oluşturma sırasında otomatik atanır)",
  "Müşteri aramasında yıl ve dosya numarası ile eşleşme"
];

export const versionNotes: VersionNote[] = [
  {
    version: "v1.6.4",
    date: "2026-04-16",
    title: "Masaüstü eski veri tabanı geçiş düzeltmesi",
    items: [
      "Windows installer sürümü 1.0.6 olarak güncellendi.",
      "Eski masaüstü veritabanlarında müşteri ve görev tabloları için eksik kalan ek uyumluluk kolonları otomatik ekleniyor."
    ]
  },
  {
    version: "v1.6.3",
    date: "2026-04-16",
    title: "Masaüstü veritabanı uyumluluk düzeltmesi",
    items: [
      "Windows installer sürümü 1.0.5 olarak güncellendi.",
      "Eski masaüstü veritabanlarında eksik kalan yeni kolonlar açılışta otomatik uyumlu hale getiriliyor.",
      "Kurulu uygulamanın packaged Next sunucusu ve masaüstü veri şeması birlikte daha güvenli başlatılıyor."
    ]
  },
  {
    version: "v1.6.2",
    date: "2026-04-16",
    title: "Masaüstü açılış ve kurulum düzeltmeleri",
    items: [
      "Windows installer sürümü 1.0.4 olarak güncellendi.",
      "Masaüstü uygulamasında otomatik güncelleme placeholder yapılandırması güvenli şekilde devre dışı bırakıldı.",
      "Masaüstü veritabanı uyumluluk düzeltmeleri ve packaged Next sunucu başlatma akışı iyileştirildi."
    ]
  },
  {
    version: "v1.6.1",
    date: "2026-04-15",
    title: "Masaüstü paket güncellemesi",
    items: [
      "Windows kurulum paketi yeni sürüm olarak güncellendi (installer 1.0.3).",
      "EXE güncelleme öncesi tam proje yedeği alınarak geri dönüş süreci güvence altına alındı."
    ]
  },
  {
    version: "v1.6.0",
    date: "2026-04-13",
    title: "Ekip, müşteri, görev ve tema iyileştirmeleri",
    items: [
      "Ekip sayfası: üye listesi için arama, filtre ve daha geniş düzen; admin için modern üye paneli.",
      "Kullanıcı (USER) rolü: ekip sayfasında yalnızca kendi üyelik bilgileri görüntülenir ve profil güncellenebilir; çalışma alanı adı, davet ve üye yönetimi yalnızca admin için.",
      "Müşteri listesi: çift tıklanan firma bilgisi modalında alt bölüm (iletişim ve düğmeler) sabit; içerik kaydırılabilir.",
      "Müşteri dosya numarası: her müşteri için workspace içinde benzersiz YYYY-N formatı (yıl bazlı sıra); kart ve detayda gösterim.",
      "Müşteri araması: dört haneli yıl (örn. 2026) ile o yıl oluşturulan veya dosya numarası o yılla başlayan müşterileri bulma; dosya numarası metin aramasında da eşleşir.",
      "Görevler: oluşturma formunda başlık altında isteğe bağlı görev içeriği alanı; liste ve panelde gösterim; uzun metinlerde taşmayı önleyen satır kırılması.",
      "Panel ve görevler sayfası: bekleyen görev kartlarında Tamamlandı / Tamamlanamadı düğmeleri alt alta; başlık ve etiket çakışmaları giderildi.",
      "Tema: sayfa yenilemede kısa süre varsayılan temaya sıçrama (FOUC) azaltıldı; seçili tema ilk boyamada uygulanır."
    ]
  },
  {
    version: "v1.5.0",
    date: "2026-04-07",
    title: "Masaüstü güvenlik, güncelleme ve dağıtım (installer 1.0.2)",
    items: [
      "Masaüstü (exe): Girişte yalnızca veritabanında doğrulanmış şifre veya admin/demo kısayolları kabul edilir; rastgele kullanıcı adı/şifre ile oturum açma kapatıldı.",
      "Masaüstü otomatik güncelleme: GitHub Releases ile uyum için paket içi app-update.yml kullanımı; isteğe bağlı DESKTOP_UPDATE_OWNER / DESKTOP_UPDATE_REPO ile repo yönlendirmesi.",
      "Ana panel (Not 5 / 5a–5g): Geniş ve tam ekranda içerik max-width ile ortalanır; 1440px+ ve 1600px+ için CTA şeridi, üst metrik kartları ve alt dört sütunlu grid aralığı, min-yükseklik ve panel padding’leri ayrı optimize edilir; kartlar eşit yükseklikte kalır.",
      "Tipografi: Kart ve panel başlıkları, ikincil metin, boş durum metinleri, buton ve menü aktif/pasif ağırlıkları ile satır yükseklikleri iyileştirildi.",
      "Dağıtım rehberi eklendi: docs/deploy-setup.md (GitHub, Vercel, Supabase, exe release adımları).",
      "Windows kurulum paketi sürümü: 1.0.2 (package.json ile uyumlu)."
    ]
  },
  {
    version: "v1.4.0",
    date: "2026-04-07",
    title: "Sürüm notları ekranı ve görünürlük",
    items: [
      "Çıkış menüsüne Versiyon Notları bağlantısı eklendi.",
      "Uygulamanın neler yapabildiğini gösteren yetenekler bölümü eklendi.",
      "Versiyon bazlı değişiklik geçmişi tek ekranda listelenmeye başlandı."
    ]
  },
  {
    version: "v1.3.0",
    date: "2026-04-07",
    title: "Giriş ve ekip yönetimi güçlendirmeleri",
    items: [
      "Owner için ekip ekranına doğrudan üye oluşturma formu eklendi.",
      "Üye oluştururken kullanıcı adı + e-posta + şifre akışı eklendi.",
      "Giriş artık e-posta veya kullanıcı adı ile yapılabiliyor."
    ]
  },
  {
    version: "v1.2.0",
    date: "2026-04-07",
    title: "Panel görev deneyimi güncellemesi",
    items: [
      "Aktif Görevler filtresine Görevlerim seçeneği eklendi.",
      "İlk açılış varsayılanı Görevlerim olacak şekilde değiştirildi.",
      "Dashboard ve Tasks sayfalarında filtre davranışı tutarlı hale getirildi."
    ]
  },
  {
    version: "v1.1.0",
    date: "2026-04-07",
    title: "Tasarım ve teknik temel iyileştirmeleri",
    items: [
      "API response standardı (ok/error envelope) uygulandı.",
      "Dev bootstrap akışı predev kontrolü ile güvenilir hale getirildi.",
      "Navigasyon tek kaynakta toplanarak shell ve mobil nav hizalandı.",
      "README/KURULUM dökümanları gerçek çalışma akışıyla eşitlendi."
    ]
  }
];
