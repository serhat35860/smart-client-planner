# Mobile Hazırlık

Bu bölüm mevcut kod yapısına göre mobil görünüm incelemesi sonrası açıldı. Amaç, online öncesi "telefon ekranında kullanılabilirlik" seviyesini garanti altına almak. Öncelik sırası yukarıdan aşağı uygulanmalı.

1. **Shell / global mobil yerleşim kontrolü**

   - Header içindeki `ThemePicker + LanguageSwitcher + Logout` alanı küçük genişliklerde satır kırınca sıkışıyor mu kontrol et.
   - Üst header + alt `MobileBottomNav` + sayfa içi sabit footer/toolbars birlikte kullanılırken içerik üst üste biniyor mu doğrula.
   - Mobilde güvenli alan (`safe-area`) boşlukları ve alt sabit navigasyon nedeniyle butonların kapanmadığını kontrol et.

2. **Dashboard mobil kullanılabilirlik turu**

   - CTA bar (`müşteri ekle / görev ekle`) dar ekranda rahat basılabilir mi kontrol et.
   - Üst metrik kartları ve hızlı aksiyon kartlarının mobilde yükseklik/oran dengesi gözden geçirilsin.
   - Dashboard içindeki tablo görünümü (`viewMode=table`) telefonda yatay taşma ve okunabilirlik açısından test edilsin.
   - Görev kartlarındaki aksiyon butonları, mention chip’leri ve creator/updater köşesi küçük ekranda çakışıyor mu kontrol et.

3. **Müşteriler sayfası mobil düzeni**

   - Sol panel + sağ içerik yapısı mobilde doğal akışta anlaşılır mı kontrol et.
   - `ClientsSidebarList` seçim deneyimi telefonda fazla uzun/yoğun kalıyorsa iyileştirme planı çıkar.
   - Seçili müşteri üst alanındaki iletişim linkleri dar ekranda taşma yapıyor mu kontrol et.
   - Müşteri not kartları `flex-wrap` yerleşiminde okunabilir mi, tek kolona zorlamak gerekir mi değerlendir.

4. **Müşteriler sayfası sabit alt toolbar çakışması**

   - Alttaki sabit `ClientsExcelToolbar` ile `MobileBottomNav` birbirini kapatıyor mu test et.
   - Mobilde admin toolbar görünümü ayrı düzen almalı mı, gizlenmeli mi, açılır panel mi olmalı karar ver.
   - Sayfa alt padding değeri toolbar + mobile nav toplam yüksekliği için yeterli mi doğrula.

5. **Görevler sayfası mobil akışı**

   - Üstteki metrik kartları + hızlı görev modal butonu küçük ekranda doğal sırada mı kontrol et.
   - `EditableTaskRow` içinde uzun başlık, içerik ve müşteri bilgisi varken buton sıkışması yaşanıyor mu test et.
   - Tamamlanan görev kartları ve tekrar oluştur akışı mobilde rahat kullanılabiliyor mu kontrol et.

6. **Hızlı görev / hızlı not modal’ları mobil testi**

   - `QuickTaskActionModal` yüksekliği (`72vh`) ve iç scroll davranışı küçük telefonlarda rahat mı test et.
   - Modal footer, klavye açıldığında input alanlarını kapatıyor mu kontrol et.
   - Benzer şekilde hızlı not / hatırlatma modal’larında da tam ekran benzeri mobil davranış gerekip gerekmediği değerlendir.

7. **Raporlar sayfası mobil öncelikli sadeleştirme**

   - Filtre satırı şu haliyle mobilde fazla yoğun; tek kolon veya açılır filtre paneli ihtiyacı değerlendir.
   - Sonuç tablosu mobilde doğrudan kullanılabilir değil; kart görünümü veya özet görünüm ihtiyacı not edilsin.
   - PDF/Excel export ve sayfalama düğmeleri telefonda üst üste binmeden kullanılabiliyor mu kontrol et.

8. **Auth ekranları mobil smoke test**

   - `login`, `register`, `join`, `workspace-suspended` sayfalarında form genişliği ve dikey boşluklar kontrol edilsin.
   - Mobil klavye açıldığında submit butonlarının görünür kalıp kalmadığı test edilsin.

9. **Tablo kullanan tüm ekranlar için ortak karar**

   - Mobilde tablo görünen alanlarda ortak yaklaşım belirlenmeli: `yatay scroll`, `kart görünümü`, ya da `özet + detay açılır panel`.
   - Bu karar `dashboard`, `reports` ve ileride benzer admin ekranlarında aynı kalıpla uygulanmalı.

10. **Mobil kabul kriterleri**

   - En küçük hedef ekran: tipik 360px genişlikte kritik akışlar bozulmadan çalışmalı.
   - Kritik akışlar: giriş, müşteri seçme, not ekleme, görev oluşturma, görev tamamlama, hatırlatma görüntüleme.
   - Son turda gerçek cihaz veya tarayıcı device emulation ile ekran görüntülü kontrol yapılmalı.
