# 0.8.0 tam kurulum

Windows 10/11 x64: DersPusulasi-0.8.0-Tam-Kurulum.zip dosyasını tamamen açıp TAM-KUR.bat çalıştırın. Varsayılan dizin LocalAppData/Programs/DersPusulasi. Paket SHA256 kontrolü, gerekirse Microsoft imzalı WebView2, uygulama, taşınabilir Python/EMA, Türkçe ses modeli ve yerel öğretmen/Ollama/Qwen modelini içerir. Ayrı Python/pip/model indirmesi gerekmez. Birkaç GB boş alan ayırın. İngilizce API sesi ve çevrim içi kaynaklar internet ve ilgili anahtar/kota gerektirir. Temiz çevrimdışı Windows sanal makinesi testi yapılmadı; ayrı yerel dizin/profil kabul testi kullanılır.

Yönetici başlangıç parolası kullanıcı tarafından belirlenen değerle hazırlanmıştır; yalnız tuzlanmış PBKDF2 doğrulaması taşınır, açık parola kaynak veya kılavuza yazılmaz. İlk 0.8.0 açılışında bir kez uygulanır, eski doğrulama kaydı yerelde korunur. Her sonraki açılışta sıfırlanmaz. Bu yerel panel kilididir, Windows hesabı yetki sınırı değildir.

İlk açılış bildirimi eksik anahtarı, test edilmemiş kaydı ve son test hatasını ayırır. Mevcut Gemini/OpenAI anahtarı varsa bu sürümde bir kez kısa gerçek metin bağlantı testi yapılır; düşük API kullanımı doğabilir. Metin testi ses kotasını garanti etmez. Ses denemesi yönetici panelindedir. 401/403, 429, 400/404 ve bağlantı/zaman aşımı çözümleri ile yönetici paneline git düğmesi vardır. Aynı durumda tekrar gösterilmez; durum değişince sonraki açılışta yenilenir. Paket API anahtarı veya hesap oturumu içermez; her alıcı kendi anahtarını güvenli panele ekler.

Tam kurulum farklı eski motor dosyalarını ve önceki EXE/kılavuz/EMA betiğini kurulum dizinindeki .rollback altına kopyalar. Öğrenci AppData depolaması silinmez. Uygulamayı normal kapatıp güncel veriyi önce dışa aktarın. Önceki 0.7.0 kurulumu korunur. Uygulama imzasızdır; WebView2 Microsoft imzası ayrıca doğrulanmıştır. Windows güvenlik uyarıları otomatik atlanmaz. WebView2: https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution . Bağımlılık lisansları pakette korunur.

---

# DersPusulası 0.7.0 — Windows kullanım ve kurulum

Kurulum dosyasını çalıştırın. Mevcut uygulama kimliği korunur; öğrenci SQLite verileri ve ses arşivi ayrı kullanıcı profilindedir. Güncellemeden önce uygulamanın Depolama ekranından veritabanı dışa aktarımı alın. Uygulamayı kapatıp kurun. Test sırasında kullanıcı profilini temizlemeyin.

İngilizce dersi → İngilizce modülleri: seviye taraması, kelime, gramer, okuma, dinleme, yazma ve konuşma. Sekmelerin bağlantıları paylaşılabilir veya yer imlerine eklenebilir. Yerel etkinlikler API anahtarı istemez. İngilizce ses için Cihazdaki İngilizce ses seçeneğini kullanın; Windows İngilizce konuşma paketi gerekir. Kurulu değilse Windows Ayarlar → Zaman ve dil → Dil ve bölge → İngilizce dil seçeneklerinden Konuşma bileşenini ekleyin. Tarayıcı sürümünde cihaz sesinin ağ kullanımı tarayıcıya bağlıdır.

Konuşma tanıması izin ve tarayıcı/WebView desteğine bağlıdır; destek yoksa metin kullanın. Sıralı sesli pratik desteklenir; kesintisiz gerçek zamanlı bulut ses oturumu ve fonem telaffuz puanı sağlanmaz. On iki konu bir çalışma dizisidir, resmi CEFR sertifikası veya tam CEFR yeterlilik garantisi değildir.

Türkçe EMA yerel sesi isteğe bağlı ek kurulum gerektirir. Uygulamanın kurulu olduğu klasördeki EMA-Kur.ps1 dosyasını Python 3.12 kurulu bir bilgisayarda çalıştırın. Betik sabit sürümlü bağımlılıkları indirir, model dosyalarının SHA256 değerlerini doğrular. Kurulum internet ve model için disk alanı gerektirir; sonrasında üretim yereldir. API anahtarı gerekmez. Başka bilgisayara bu bilgisayarın Python venv klasörünü kopyalamayın; yeniden kurun. EMA kurulmadığında Türkçe metinle çalışabilirsiniz; yerel motor kurulana kadar buluta ses gönderilmez.

Çevrim içi destek isteğe bağlıdır. Anahtarları yalnız uygulamanın güvenli Modeller ve API ayarlarına kaydedin. Anahtarları e-posta, kaynak ZIP'i veya konuşma metniyle paylaşmayın. Yazma geri bildirimi ve öğretmenle konuşma düğmesine bastığınızda yalnız belirtilen metin ve konu bağlamı sağlayıcıya gönderilir; servis ücret/kota koşulları o sağlayıcıya bağlıdır. Öğrenci ses kayıtları bu İngilizce modülünde saklanmaz. Yazma taslakları ve geçmişi bu cihazın öğrenci veritabanına yazılır.

Kurulum dosyası Windows kod imzalama sertifikasıyla imzalanmamıştır. SHA256 manifesti dosya bütünlüğünü kontrol eder; yayıncı kimlik doğrulaması sağlamaz. Windows güvenlik uyarılarını otomatik atlayan bir kurulum yöntemi kullanılmaz. İnternete açık güncelleme sunucusu veya otomatik güncelleme yoktur. Mevcut WebView2 yoksa kurulumun Microsoft'tan WebView2 indirmesi gerekebilir; tamamen çevrimdışı temiz bilgisayar kurulumu iddiası yoktur.

Geri alma: önce güncel veritabanını dışa aktarın; önceki EXE/kaynak yedekleri Çalışma altındaki önceki teslimlerde korunur. Güncelleme ek tablolar kullanır; eski sürüme dönmek için öğrenci depolamasını silmeyin. Yeni kayıtların eski sürümde görünmemesi veri silindiği anlamına gelmez.

Kaynak dağıtımı: npm ci → npm test → npm run tauri -- build --bundles nsis. Paket lisansları licenses/ altında korunur. Kurulum dizini için kullanıcı kapsamı seçilmiştir; uygulama kimliği com.studycompanion.lise1 olarak korunur. Tauri kaynakları: https://v2.tauri.app/distribute/windows-installer/ ve https://v2.tauri.app/reference/config/.


0.7.0: Anlatım hızı mevcut tercihten bir kez %20 azaltılır; son adımda durur. Daha yavaş dinle düğmesi mevcut bölümü tekrar okur. Ses önizleme sağlayıcısı ve genel hız yalnız yönetici panelinde bulunur. Türkçe anlatım yerel EMA kullanır; İngilizce anlatım kayıtlı anahtarı olan Gemini Flash → Gemini Lite → OpenAI → ElevenLabs sırasıyla API kullanır. Başarısız sağlayıcı beş dakika atlanır. Anahtarı/kotası olmayan servis çalışıyor gösterilmez. Gemini modelleri aynı hesap kotasını paylaşabilir. API yedekleri için ilgili sağlayıcıya yalnız seslendirilecek metin gönderilir ve ücret doğabilir. Öğretmen adları uygulama içindeki ses karakterleridir, gerçek öğretmen yokluğu iddiası değildir. Deniz yerel sesin cinsiyet varsaymayan adıdır; Emre/Elif/Mert/Kerem sırasıyla Charon/Kore/Echo/Josh ses kimliklerine bağlıdır. Özel ses önizlemeleri yöneticinin seçimine bağlıdır; normal ders politikası önizlemeden ayrıdır.

Her ünite sonunda %80 geçiş eşikli sınav vardır. Yanıtlar ve sonuçlar öğrenciye bağlı saklanır; yarım sınav devam eder. İngilizcede sonraki ünite düğmesi sınav başarısını da bekler.

Yerel öğretmen: Yerel-Ogretmen-EkPaketi.zip dosyasını uygulamanın derspusulasi.exe dosyasıyla aynı klasöre açın. .runtime/ollama ve .runtime/ollama-models alt klasörleri korunmalı. Uygulama açıldığında yalnız 127.0.0.1:11434 üzerinde başlatılır; uygulamanın başlattığı süreç kapanışta durur. Önceden çalışan başka Ollama servisi kapatılmaz. Qwen2.5:1.5b küçük bir yerel modeldir; yanıtları hatalı olabilir, ders kaynağıyla karşılaştırın. Pakette hesap oturumu veya anahtar bulunmaz. Bulut anahtarları alınmış gibi gösterilmez: kullanıcı kendi sağlayıcı hesabından alıp yalnız güvenli panele kaydeder.

Soru bankası olmayan ünitelerde sınav soruları kayıtlı dersin çözümlü örneğine dayanır; bunlar otomatik üretim değildir. Basit ax+b=c soruları doğrulanmış yerel aritmetik ile yanıtlanır. Daha karmaşık serbest sorularda yerel modelin doğruluk garantisi yoktur.

0.7.0 öğrenci akışı: Menü, başlık, yardım, erişilebilirlik etiketi ve üretilen yanıt sunumları sadeleştirildi. Bekleyen yanıtlarda ve ses/materyal hazırlanırken görünür durum mesajı vardır; hata veya tamamlanmada kalkar. Öğretmen paneli açılınca yazı alanı hazırdır; Enter gönderir, Shift+Enter alt satır açar. İngilizce gramer/okuma/dinleme alıştırmalarında seçenek işaretlemek cevabı kaydeder; sınavın son teslim düğmesi korunur. Konuyu canlandır tek tıklamayla başlar; Özel konu isteğe bağlıdır. Öğrencinin kendi yazdığı metinlere veya eski kayıtlara toplu değiştirme uygulanmaz.


0.7.0 ders görünümü: Pastel arka plan, cam kartlar, solda gerçek konu akışı ve geniş etkileşimli anlatım alanı. Ders seçimi soldaki menüdedir; konu kartına dokunmak konuyu açar ve seçimi kaydeder. Konu sayacı konumu gösterir, başarı yüzdesi değildir. Kaynaklar ve ünite sınavı anlatımın altındadır. Telefon ekranında konu kartları yatay kaydırılır. Derslerime dön ana sayfayı açar. Mevcut yerel öğretmen ek paketi değişmeden uyumludur.


0.7.0: Ders sayfaları ve konu geçişleri sessiz, duraklatılmış açılır. Derse başla düğmesi sesli anlatımı başlatır; Duraklat durdurur. Tekrar Dinle ve daha yavaş dinleme yalnız öğrenci tıklamasıyla çalışır. Son adımda otomatik durma korunur. Ders metni 16 piksel, düğmeler 14 piksel, konu kartları 15 piksel; satır aralığı ve kontrast artırılmıştır.


0.7.0: Ayarlar yalnız Yönetici panelindedir. İlk girişte cihaz yöneticisi en az 10 karakterlik parolasını kendisi oluşturur; parola kaynakta veya teslim paketinde bulunmaz. Panelden çıkınca tekrar giriş gerekir. Bu yerel uygulama parolası Windows hesabından ayrı bir kullanım kilididir; aynı Windows hesabındaki dosya/araç erişimini izole eden çok kullanıcılı bir sunucu değildir. Parolayı güvenli saklayın. Kaynak, API, ses, görünüm, depolama, İngilizce ve medya ayarları bu panelde toplanır.

Ses sağlayıcısı Gemini, ses Charon, model gemini-3.8-flash-tts olarak bir kez geçirilir. Önceki tercih voice_before_gemini_calm ayarında saklanır. Üslup sakin, destekleyici, sabırlı, anlaşılır ve doğal duraklamalıdır. Ses hâlâ yalnız Derse başla ile başlar. Hız değiştirilmez; önceki yavaşlatma korunur. Anahtar ve model kotası gerekir. Eski 2.5 metin modeli bu hesapta 404 verdiği için doğrulanmış gemini-3.5-flash-lite önerilir; önceki profil korunur.

NotebookLM normal Google hesabında kaynak aktarımıyla kullanılır: Ders kaynağını indir, NotebookLM'i aç, kendi not defterinize kaynak olarak ekleyin. Yalnız ders içeriği dışa çıkar; öğrenci notları ve hesap oturumu aktarılmaz. Yöneticiler ders başına resmi not defteri bağlantısı kaydedebilir. Enterprise API veya otomatik hesap oturumu kullanılmaz. Resmi kaynaklar: https://ai.google.dev/gemini-api/docs/speech-generation?hl=tr ve https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-notebooks .

Üst çubuktaki Geri/İleri uygulama sayfa geçmişinde gezinir. Ders yolundaki Önceki konu/Sonraki konu ders konusunu değiştirir. Yeni konu kendiliğinden seslendirilmez.

0.7.0: Öğretmene “Anlamadım” veya “Başka örnek ver” yazınca görsel ve açıklama birlikte değişir. Kümeler, denklemler ve hareket/kuvvet için iki farklı günlük yaşam örneği vardır. Diğer konularda öğretmen bağlantısı, aynı hedefe uygun farklı günlük yaşam örneği hazırlamayı dener; yanıt şeması denetlenir, metin HTML olarak çalıştırılmaz. Bağlantı yoksa kayıtlı çözümlü örnek farklı sırayla gösterilir ve başlık bunu açıkça belirtir. Üretilen örneklerin doğruluğu her konu için insan tarafından onaylanmış değildir. Ses yine Derse başla ile başlar. Kayıtlı örnekler ağ isteği gerektirmez; diğer konuların yeni örneği öğretmen bağlantısını kullanabilir. Görseller yerel SVG ile çizilir, üçüncü taraf görsel dosyası indirilmez.


0.9.0 — Ayrıntılı ders videoları
Hazırlanmış ve kurulum paketine eklenmiş konularda Daha detaylı anlat düğmesi görünür. Öğrenci tek tıklamayla sesli ve görsel dersi uygulamada izler; Google hesabı, NotebookLM arayüzü veya ayrı pencere açılmaz. Normal ders kendiliğinden başlamaz. Video yalnız öğrenci açınca oynar, bir kez bitip durur. Daha yavaş ve Konu anlatımına dön düğmeleri vardır.

Yönetici panelinin NotebookLM bölümünden yeni MP4 ders eklenebilir (en fazla 150 MB). Önce konu ve video uygunluğu denetlenir. Önceki dosya saklanır. Bu cihazda eklenen video başka bilgisayara kendiliğinden aktarılmaz; dağıtılacak dersler lesson-media klasörüne eklenip paket yeniden hazırlanmalıdır. Normal Google hesabında canlı arka plan üretim API'si kullanılmaz; videolar önceden hazırlanmıştır. Hazır olmayan konu için video düğmesi gösterilmez. Üretim kuyruğu ve kota durumu Çalışma/NotebookLM-Ayrintili-20261018 içinde kayıtlıdır.


0.10.0 — Çevrimdışı İngilizce öğretmen sesi
Türkçe anlatım EMA ile devam eder. İngilizce ders sesleri artık yerel Kitten TTS Mini 0.8 modelinden gelir; normal anlatımda bulut ses servisine otomatik geçilmez. İnternet ve API anahtarı gerekmez. İlk hazırlama işlemcide zaman alabilir; Hazırlanıyor mesajı beklenir. Derse başla ve daha yavaş davranışı korunur. Üretilen ses aynı cihazda yeniden kullanılır.
Yönetici paneli → Ses ve uygulama bölümünden Jasper/Bella/Bruno/Luna/Hugo/Rosie/Leo/Kiki seçilebilir. Ad ve cinsiyet kaynak modelin ses listesidir. Ayarlar öğrencinin ders ekranına eklenmez. Öğretmen değiştiğinde yeni öğretmen kendini tanıtır.
Tam paketi tamamen açıp TAM-KUR.bat çalıştırın. İngilizce Python/ONNX, ses modeli, eSpeak verileri ve lisans/kaynakları pakettedir; ders sırasında paket veya model indirilmez. Anahtarlar ve hesap oturumları aktarılmaz. Mevcut veriler, parolalar ve eski geri alma yedekleri korunur. Tek başına küçük NSIS kurucusu yerel çalışma ortamlarını içermez; yeni bilgisayara TAM paket gerekir.
Ses testi harici ağ bağlantısı engellenmiş Python işleminde gerçek WAV üreterek yapıldı; temiz çevrimdışı Windows sanal makinesi ayrıca denenmedi. Sadece ses üretimi çevrimdışı hale getirildi: isteğe bağlı çevrimiçi öğretmen değerlendirmesi, web arama ve bulut medya önizlemeleri ayrı servislerdir.
Windows kısa dosya adı desteği kapalı ve kurulum yolunda Türkçe/özel karakter varsa eSpeak veri yolu açılamayabilir; bu durumda ASCII harfli kurulum yolu gerekir. Bu bilgisayardaki Türkçe karakterli proje yolu kısa yol adıyla doğrulandı.
