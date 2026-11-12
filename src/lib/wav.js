/**
 * Seçilen aralığı 16-bit PCM WAV olarak kodlar.
 * Tamamen tarayıcıda, bağımlılıksız — dosya hiçbir yere gönderilmez.
 */
export function encodeWav(buffer, startSeconds, endSeconds) {
  const sampleRate = buffer.sampleRate;
  const channels = buffer.numberOfChannels;

  const startFrame = Math.max(0, Math.floor(startSeconds * sampleRate));
  const endFrame = Math.min(buffer.length, Math.ceil(endSeconds * sampleRate));
  const frames = Math.max(1, endFrame - startFrame);

  const bytesPerSample = 2;
  const dataSize = frames * channels * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeTag = (offset, tag) => {
    for (let i = 0; i < tag.length; i++) view.setUint8(offset + i, tag.charCodeAt(i));
  };

  writeTag(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeTag(8, 'WAVE');
  writeTag(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk boyutu
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true); // byte rate
  view.setUint16(32, channels * bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bit depth
  writeTag(36, 'data');
  view.setUint32(40, dataSize, true);

  const channelData = [];
  for (let c = 0; c < channels; c++) channelData.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = startFrame; i < endFrame; i++) {
    for (let c = 0; c < channels; c++) {
      const sample = Math.max(-1, Math.min(1, channelData[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export function wavSizeFor(buffer, startSeconds, endSeconds) {
  const frames = Math.max(
    1,
    Math.ceil(endSeconds * buffer.sampleRate) - Math.floor(startSeconds * buffer.sampleRate),
  );
  return 44 + frames * buffer.numberOfChannels * 2;
}
