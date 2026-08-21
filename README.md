# Dijital Bilim Felsefesi

Kastamonu Üniversitesi Bilim Tarihi Bölümü bünyesinde, TÜBİTAK 2218 (`123C302`) kapsamında yürütülen dijital bilim felsefesi araştırma projesinin web arayüzüdür.

Bu sitede proje hakkında bilgi, literatür arşivi, metin analizi, mekansal analiz, atıf ağı ve 3B ağ görselleştirmesi yer alır.

## Metin Düzenleme

Site metinlerini değiştirmek için yalnızca [METINLERI_DUZENLE.json](src/METINLERI_DUZENLE.json) dosyasını açın. Üniversite, proje bilgileri, ekip, iletişim, başlıklar ve açıklamalar bu tek dosyadadır.

GitHub üzerinden düzenleme adımları:

1. Dosya listesinden `src` klasörünü, ardından `METINLERI_DUZENLE.json` dosyasını açın.
2. Sağ üstteki kalem simgesine tıklayın.
3. Sadece çift tırnak içindeki metni değiştirin.
4. Virgülleri, tırnak işaretlerini, köşeli parantezleri ve süslü parantezleri silmeyin.
5. Sayfanın altındaki `Commit changes` düğmesine tıklayın.

Bir listeye yeni satır eklemek isterseniz, önceki satırın sonunda virgül bulunmalıdır. Tereddüt edilen değişikliklerde dosyanın bir kopyasını alıp proje sorumlusu ile paylaşmak daha güvenlidir.

## Siteyi Görüntüleme

Site Cloudflare Workers üzerinde `dijitalbilimfelsefesi.com` alan adıyla yayınlanacak şekilde ayarlanmıştır. GitHub'a kaydedilen metin değişiklikleri, proje geliştiricisi tarafından `npm run deploy` komutuyla yayınlanır. Güncelleme görünmüyorsa sayfayı yenileyin veya tarayıcı önbelleğini temizleyin.

## Cloudflare Yayını

İlk yayın için Cloudflare hesabında `dijitalbilimfelsefesi.com` alan adının eklenmiş ve etkin olması gerekir. Proje klasöründe aşağıdaki komut çalıştırılır:

```bash
npm install
npm run deploy
```

İlk çalıştırmada Cloudflare oturum açma sayfası açılır. Oturum açıldıktan sonra Worker, alan adına otomatik olarak bağlanır. Cloudflare API anahtarı veya şifre hiçbir zaman bu depoya yazılmamalıdır.

## Proje Bilgileri

- Program: TÜBİTAK 2218
- Proje No: 123C302
- Proje Yürütücüsü: Doç. Dr. Ömer Fatih TEKİN
- Danışman: Prof. Dr. Mehmet Hilmi DEMİR
- Birim: Kastamonu Üniversitesi İnsan ve Toplum Bilimleri Fakültesi, Bilim Tarihi Bölümü

## Teknik Not

Sitenin yerelde çalıştırılması veya tasarım/kod değişiklikleri için Node.js gerekir. Teknik işlem gerektiğinde proje geliştiricisiyle iletişime geçilmelidir.
