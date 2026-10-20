# DersPusulası

Windows için kişisel öğrenme uygulaması: konu anlatımı, örnekler, alıştırmalar, ünite sınavları ve öğrenci ilerlemesi.

## Kurulum

[Sürümler](https://github.com/hizliislerajansi/Egitim/releases) sayfasındaki Windows kurucusunu kullanın. İlk çevrimdışı kurulum için tam paketi tamamen açıp TAM-KUR.bat dosyasını çalıştırın. Küçük uygulama güncellemeleri yerel ses modellerini içermez; önceden kurulmuş tam paketin üzerine kurulmalıdır.

Güncel geliştirme sürümü **0.10.1**. İndirme dosyaları ancak Releases sayfasında yayımlandığında hazırdır.

## Kullanım

- Ders yalnız **Derse başla** ile başlar, anlatım bitince durur; daha yavaş dinlenebilir.
- Türkçe EMA ve İngilizce sekiz yerel öğretmen sesi, modeller kurulduktan sonra internet veya API anahtarı gerektirmez.
- **Anlamadım** farklı örnek ve görsel sunar. Hazır ayrıntılı videolar uygulama içinde izlenir.
- İlerleme ve notlar cihazda tutulur; Depolama bölümünden yedeklenebilir.
- Bütün ayarlar yönetici panelindedir. Hesap oturumu, parola ve API anahtarları depoya dahil edilmez.

## GitHub güncellemesi

**Yönetici paneli → Güncellemeler → Kaydet ve güncellemeyi kontrol et**. Varsayılan depo hizliislerajansi/Egitim olur. Son kararlı sürüm kontrol edilir; yeni sürüm varsa GitHub sayfası açılır. Kontrol internet gerektirir; kurulum kendiliğinden başlatılmaz.

Güncellemeden önce öğrenci yedeği alın, uygulamayı kapatın ve kurucuyu mevcut klasöre kurun. Kullanıcı profilini, .runtime klasörünü ve geri alma yedeklerini silmeyin. Otomatik imzalı arka plan güncellemesi henüz etkin değildir.

## Geliştirme

Node.js 24, Rust/MSVC araç zinciri, Windows SDK ve WebView2 gerekir.

```powershell
npm ci
npm test -- --maxWorkers=4
npm run build
npm run lint
cargo test --manifest-path src-tauri/Cargo.toml --lib
npm run tauri build -- --bundles nsis
```

Web arayüzü: npm run dev. Tam yerel ses için ayrıca Python ortamları ve modeller gerekir. Kaynak deposuna dahil edilmez; lisanslar docs/THIRD-PARTY-NOTICES.txt ve docs/vendor içinde, İngilizce model bilgileri docs/voice-studio-model.json dosyasındadır.

## Sürüm yayımlama

src-tauri/tauri.conf.json sürümünü artırın. Yerel testler ve kurulum kabulünden sonra aynı sürümün vX.Y.Z etiketini gönderin. GitHub Actions Windows kurucusu ve SHA256 listesini Releases sayfasına ekler. Actions izni gerekir; yazma izni yalnız yayımlama işine verilir. Uygulamaya kullanıcı GitHub anahtarı eklenmez.

Tam çevrimdışı paket Python ortamlarını ve modelleri de içerir; ayrıca hazırlanıp aynı sürüme yüklenir. CI kurucusu tek başına ilk çevrimdışı kurulum paketi değildir. Öğrenci verisi, özel yedekler ve oturumlar yayımlanmaz.
