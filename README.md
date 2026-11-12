# kes

Tarayıcıda çalışan, basit ve gizlilik odaklı bir ses kesici.

Ses dosyası **hiçbir sunucuya gitmez**. Dosya tarayıcıda çözülür, dalga formu
yerel olarak çizilir ve kesim yine tarayıcıda WAV olarak kodlanır. Hesap, kayıt,
analitik, harici font veya CDN yok — sayfa bir kez yüklendikten sonra ağ isteği
yapmadan çalışır.

## Ne yapar

- Dosyayı sürükle-bırak, dosya seç veya panodan yapıştır ile açar
- Dalga formu üzerinde sürükleyerek başlangıç/bitiş seçer, tutamaçlarla ince ayar yapar
- Seçimi baştan sona dinletir (canlı imleç)
- Sadece seçilen aralığı 16-bit PCM **WAV** olarak indirir
- Mobil dahil çalışır; klavye ile kullanılabilir (tutamaçlar `←` `→`, `shift` hızlı,
  `boşluk` çal/durdur)

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ içine statik çıktı
npm run preview
```

Derlenmiş `dist/` klasörü herhangi bir statik sunucuda yayınlanabilir; backend
gerekmez.

## Nasıl çalışıyor

| Adım | Teknoloji |
| --- | --- |
| Çözme | `AudioContext.decodeAudioData` |
| Dalga formu | Canvas üzerine, buffer'dan çıkarılan tepe (peak) değerleri |
| Kesme | Seçilen kare aralığının kopyalanması |
| Kodlama | `DataView` ile 16-bit PCM WAV başlığı + örnekler |
| İndirme | `Blob` + geçici `URL.createObjectURL` |

## Sınırlar

- Çıktı formatı yalnızca WAV (kayıpsız, tarayıcıda ek kütüphane gerektirmeden üretilebilir)
- Çok büyük dosyalar tarayıcı belleğini kullanır; dosya boyutu üst sınırı yoktur ama
  pratikte cihaza bağlıdır
- Giriş formatı tarayıcının çözebildiği formatlarla sınırlı (mp3, wav, m4a, ogg, flac…)

## English

`kes` is a local-first audio cutter that runs entirely in your browser: pick a file,
drag across the waveform to select a range, preview it, then download the cut as WAV.
Nothing is uploaded — decoding, cutting and encoding all happen in the tab, and the
page makes no network requests after loading.

The interface ships in Turkish and English. Use the **EN / TR** button in the top
right to switch; your choice is remembered.

Same workflow as above: `npm install`, `npm run dev`, `npm run build`.

## Lisans

MIT — bkz. [LICENSE](./LICENSE)
