export const LANGUAGES = ['tr', 'en'];

export const messages = {
  tr: {
    htmlLang: 'tr',
    title: 'kes — tarayıcıda ses kesici',
    description: 'Ses dosyanı tarayıcında kes. Yükleme yok, hesap yok; dosyan cihazından çıkmaz.',
    switchTo: 'Switch to English',
    toggleLabel: 'EN',
    privacy: 'hiçbir şey yüklenmez',
    headline1: 'Sesi kes.',
    headline2: 'Dosyan cihazında kalsın.',
    intro:
      'Kayıt yok, hesap yok, yükleme yok. Ses dosyası tarayıcının içinde çözülür ve yine orada kesilir — sunucuya tek bir bayt gitmez.',
    dropTitle: 'Ses dosyanı buraya bırak',
    dropBusy: 'Çözümleniyor…',
    dropBusyHint: 'Dosya cihazında işleniyor',
    dropHint: 'veya',
    dropChoose: 'dosya seç',
    dropFormats: '· mp3, wav, m4a, ogg, flac',
    changeFile: 'Dosya değiştir',
    decoding: 'Çözümleniyor…',
    editorLabel: 'Ses kesici',
    start: 'Başlangıç',
    end: 'Bitiş',
    length: 'Uzunluk',
    play: 'Çal',
    stop: 'Durdur',
    selectAll: 'Tümünü seç',
    download: 'WAV indir',
    downloaded: 'İndirildi',
    error: 'Bu dosya çözümlenemedi. mp3, wav, m4a veya ogg dene.',
    keyDrag: 'sürükle',
    keySpace: 'boşluk',
    hintSelect: 'seçim',
    hintPlay: 'çal / durdur',
    hintNudge: 'ince ayar',
    hintFast: 'hızlı',
    footerA: 'Ağ isteği yok · çevrimdışı çalışır',
    footerB: 'Ses hiçbir yere gönderilmez',
    startPoint: 'Başlangıç noktası',
    endPoint: 'Bitiş noktası',
    mono: 'mono',
    stereo: 'stereo',
    channels: 'kanal',
  },
  en: {
    htmlLang: 'en',
    title: 'kes — audio cutter in your browser',
    description:
      'Cut audio in your browser. No uploads, no account; your file never leaves your device.',
    switchTo: 'Türkçeye geç',
    toggleLabel: 'TR',
    privacy: 'nothing is uploaded',
    headline1: 'Cut the audio.',
    headline2: 'Keep the file on your device.',
    intro:
      'No sign-up, no account, no upload. Your audio is decoded inside the browser and cut right there — not a single byte reaches a server.',
    dropTitle: 'Drop your audio file here',
    dropBusy: 'Decoding…',
    dropBusyHint: 'Processing on your device',
    dropHint: 'or',
    dropChoose: 'choose a file',
    dropFormats: '· mp3, wav, m4a, ogg, flac',
    changeFile: 'Change file',
    decoding: 'Decoding…',
    editorLabel: 'Audio cutter',
    start: 'Start',
    end: 'End',
    length: 'Length',
    play: 'Play',
    stop: 'Stop',
    selectAll: 'Select all',
    download: 'Download WAV',
    downloaded: 'Downloaded',
    error: 'Could not decode this file. Try mp3, wav, m4a or ogg.',
    keyDrag: 'drag',
    keySpace: 'space',
    hintSelect: 'select',
    hintPlay: 'play / pause',
    hintNudge: 'nudge',
    hintFast: 'faster',
    footerA: 'No network requests · works offline',
    footerB: 'Audio never leaves your device',
    startPoint: 'Start point',
    endPoint: 'End point',
    mono: 'mono',
    stereo: 'stereo',
    channels: 'channels',
  },
};

const STORAGE_KEY = 'kes-lang';

export function detectLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.includes(stored)) return stored;
  } catch {
    /* gizli sekmede localStorage kapalı olabilir */
  }
  const browserLang = (navigator.language || 'en').toLowerCase();
  return browserLang.startsWith('tr') ? 'tr' : 'en';
}

export function rememberLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* yok sayılır */
  }
}
