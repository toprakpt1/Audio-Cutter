/* Biçimlendirme yardımcıları — dile göre ondalık ayırıcı. */

const decimal = (lang) => (lang === 'tr' ? ',' : '.');

export function formatTime(seconds, lang = 'tr') {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const cs = Math.round(seconds * 100);
  const minutes = Math.floor(cs / 6000);
  const secs = Math.floor((cs % 6000) / 100);
  const centis = cs % 100;
  return `${minutes}:${String(secs).padStart(2, '0')}${decimal(lang)}${String(centis).padStart(2, '0')}`;
}

export function formatBytes(bytes, lang = 'tr') {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', decimal(lang))} MB`;
}

export function formatSampleRate(sampleRate, lang = 'tr') {
  return `${(sampleRate / 1000).toFixed(1).replace('.', decimal(lang))} kHz`;
}

export function formatChannels(channels, t) {
  if (channels === 1) return t.mono;
  if (channels === 2) return t.stereo;
  return `${channels} ${t.channels}`;
}
