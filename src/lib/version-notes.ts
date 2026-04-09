export type VersionNote = {
  version: string;
  date: string;
  title: string;
  items: string[];
};

export const productCapabilities: string[] = [
  "Müşteri, not ve görev yönetimi tek çalışma alanında",
  "Bağımsız not, müşteriye bağlı not ve görev dönüşüm akışı",
  "Hatırlatma planlama, erteleme ve tamamlama akışı",
  "Takım üyeliği yönetimi (admin/kullanıcı, aktif/pasif)",
  "Admin tarafından doğrudan kullanıcı oluşturma",
  "E-posta veya kullanıcı adı ile giriş desteği",
  "Panelde görev filtreleri (Görevlerim, tümü, tamamlanamayan, tamamlanan)",
  "Rapor ekranı (tarih aralığı, PDF/Excel çıktı)",
  "Tam aktivite günlüğü: güncellemeler, görev sonuçları ve çalışma alanı audit olayları (admin raporlarında)"
];

export const versionNotes: VersionNote[] = [
  {
    version: "v1.6.0",
    date: "2026-04-09",
    title: "Sürüm 1.1.0 — aktivite günlüğü, audit ve yayın güvencesi",
    items: [
      "Raporlar: tarih aralığında müşteri/not/görev oluşturma ve güncelleme, görev tamamlanma/başarısız, etiket ve audit satırları tek listede (PDF/Excel).",
      "Çoklu kullanıcı için audit altyapısı: sabit olay adları, workspace aktivite kaydı (IP/UA), müşteri son güncelleyen alanı (updatedBy).",
      "Sürüm öncesi: Vitest birim testleri, npm run pre-release / dev:stop / release:check; CI’da test adımı.",
      "Masaüstü: build.publish varsayılanı boş — yanlış GitHub adresi gömülmesin; güncelleme için DESKTOP_UPDATE_* veya release sırasında publish tanımlayın.",
      "Windows kurulum paketi / uygulama sürümü: 1.1.0 (package.json ile uyumlu)."
    ]
  },
  {
    version: "v1.5.0",
    date: "2026-04-07",
    title: "Masaüstü güvenlik, güncelleme ve dağıtım (installer 1.0.2)",
    items: [
      "Masaüstü (exe): Girişte yalnızca veritabanında doğrulanmış şifre veya admin/demo kısayolları kabul edilir; rastgele kullanıcı adı/şifre ile oturum açma kapatıldı.",
      "Masaüstü otomatik güncelleme: GitHub Releases ile uyum için paket içi app-update.yml kullanımı; isteğe bağlı DESKTOP_UPDATE_OWNER / DESKTOP_UPDATE_REPO ile repo yönlendirmesi.",
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
