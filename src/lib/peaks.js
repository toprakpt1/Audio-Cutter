/**
 * Dalga formu için tepe (peak) değerleri.
 * Dekode edilmiş buffer'ı sabit sayıda kutuya bölüp her kutunun en yüksek
 * genliğini döndürür. Kanal sayısı ne olursa olsun ilk iki kanal yeter.
 */
export function computePeaks(buffer, buckets = 2400) {
  const channels = Math.min(2, buffer.numberOfChannels);
  const data = [];
  for (let c = 0; c < channels; c++) data.push(buffer.getChannelData(c));

  const length = buffer.length;
  const peaks = new Float32Array(buckets);
  const block = length / buckets;

  for (let i = 0; i < buckets; i++) {
    const from = Math.floor(i * block);
    const to = Math.min(length, Math.floor((i + 1) * block));
    let max = 0;
    for (let j = from; j < to; j++) {
      for (let c = 0; c < channels; c++) {
        const value = Math.abs(data[c][j]);
        if (value > max) max = value;
      }
    }
    peaks[i] = max;
  }

  return peaks;
}
